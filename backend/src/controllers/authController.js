const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

const User = require('../models/User');
const Organization = require('../models/Organization');

// Helper to send standardized responses
function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// Create transporter for nodemailer using env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, organizationId, organizationName } = req.body;
    if (!name || !email || !password) {
      return sendResponse(res, false, {}, 'Name, email and password are required', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) return sendResponse(res, false, {}, 'Email already registered', 409);

    // If no organizationId provided, create a new Organization for this user
    let orgId = organizationId || null;

    // Create user first; we'll attach org after creating org so ownerId references user
    const user = new User({ name, email, password, role, organizationId: orgId });
    await user.save();

    if (!orgId) {
      const orgDoc = new Organization({ name: organizationName || `${name}'s Organization`, email, ownerId: user._id });
      await orgDoc.save();
      orgId = orgDoc._id;
      // attach orgId to user and save
      user.organizationId = orgId;
      await user.save();
    }

    // Return user and tokens (access token will include organizationId via User.generateJWT)
    const accessToken = user.generateJWT();
    const refreshToken = user.generateRefreshToken();
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return sendResponse(res, true, { user: user.toJSON(), accessToken, refreshToken }, 'User registered');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, err.message || 'Registration failed', 500);
  }
};

// Login (email + password) -> returns access & refresh tokens
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt received for:', email);
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return sendResponse(res, false, {}, 'Email and password required', 400);
    }

    const user = await User.findOne({ email });
    console.log('User lookup result for', email, ':', !!user);
    if (!user) return sendResponse(res, false, {}, 'Invalid credentials', 401);

    let match = false;
    try {
      match = await user.comparePassword(password);
    } catch (cmpErr) {
      console.error('Error during password compare for', email, cmpErr && cmpErr.stack ? cmpErr.stack : cmpErr);
      throw cmpErr;
    }
    console.log('Password compare result for', email, ':', match);
    if (!match) return sendResponse(res, false, {}, 'Invalid credentials', 401);

    // Optionally check isActive
    if (!user.isActive) return sendResponse(res, false, {}, 'User is inactive', 403);

    // Ensure user.organizationId is set (lookup by ownerId if necessary)
    if (!user.organizationId) {
      try {
        const org = await Organization.findOne({ ownerId: user._id }).select('_id');
        if (org) {
          user.organizationId = org._id;
          await user.save();
        }
      } catch (e) {
        console.error('Failed to lookup organization for user during login:', e);
      }
    }

    const accessToken = user.generateJWT();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token (allow multiple sessions)
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return sendResponse(res, true, { accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    // Temporary debug log: print incoming email (not password) and the error stack
    try {
      const incoming = (req && req.body && req.body.email) || '<no-email>';
      console.error('Login error for:', incoming);
    } catch (e) {}
    console.error(err && err.stack ? err.stack : err);
    return sendResponse(res, false, {}, 'Login failed', 500);
  }
};

// Logout - invalidate refresh token
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendResponse(res, false, {}, 'Refresh token required', 400);

    // Find user containing this refresh token and remove it
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) return sendResponse(res, true, {}, 'Logged out');

    user.refreshTokens = user.refreshTokens.filter((r) => r.token !== refreshToken);
    await user.save();

    return sendResponse(res, true, {}, 'Logged out successfully');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, 'Logout failed', 500);
  }
};

// Refresh token -> generate new access token (and optionally rotate refresh token)
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendResponse(res, false, {}, 'Refresh token required', 400);

    // Verify token signature
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return sendResponse(res, false, {}, 'Invalid refresh token', 401);
    }

    const user = await User.findById(payload.id);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    // Check token presence in DB (not revoked)
    const found = user.refreshTokens.find((r) => r.token === refreshToken);
    if (!found) return sendResponse(res, false, {}, 'Refresh token revoked', 401);

    // Issue new access token
    const accessToken = user.generateJWT();

    // Optional: rotate refresh token
    const rotate = process.env.ROTATE_REFRESH_TOKENS === 'true';
    let newRefreshToken = refreshToken;
    if (rotate) {
      newRefreshToken = user.generateRefreshToken();
      // Remove old and add new
      user.refreshTokens = user.refreshTokens.filter((r) => r.token !== refreshToken);
      user.refreshTokens.push({ token: newRefreshToken });
      await user.save();
    }

    return sendResponse(res, true, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, 'Refresh failed', 500);
  }
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendResponse(res, false, {}, 'Email required', 400);

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, true, {}, 'If account exists, reset email sent');

    // Create reset token (JWT)
    const token = jwt.sign({ id: user._id, action: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password reset',
      text: `You requested a password reset. Use this link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return sendResponse(res, true, {}, 'If account exists, reset email sent');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, 'Failed to send reset email', 500);
  }
};

// Reset password - verify token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendResponse(res, false, {}, 'Token and new password required', 400);

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return sendResponse(res, false, {}, 'Invalid or expired token', 400);
    }

    if (payload.action !== 'reset') return sendResponse(res, false, {}, 'Invalid token action', 400);

    const user = await User.findById(payload.id);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    user.password = password;
    // Optionally clear all refresh tokens on password reset
    user.refreshTokens = [];
    await user.save();

    return sendResponse(res, true, {}, 'Password reset successful');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, 'Reset failed', 500);
  }
};

// Enable 2FA - generate TOTP secret and return otpauth_url
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user && req.user.id; // assumes auth middleware populated req.user
    if (!userId) return sendResponse(res, false, {}, 'Authentication required', 401);

    const user = await User.findById(userId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    const secret = speakeasy.generateSecret({ name: `WhatsAppPlatform (${user.email})` });

    user.twoFactorSecret = secret.base32;
    // Do not enable yet until verification
    await user.save();

    return sendResponse(res, true, { otpauth_url: secret.otpauth_url, base32: secret.base32 }, '2FA secret generated');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, 'Enable 2FA failed', 500);
  }
};

// Verify 2FA code
exports.verify2FA = async (req, res) => {
  try {
    const userId = req.user && req.user.id; // assumes auth middleware populated req.user
    const { token } = req.body;
    if (!userId) return sendResponse(res, false, {}, 'Authentication required', 401);
    if (!token) return sendResponse(res, false, {}, 'TOTP token required', 400);

    const user = await User.findById(userId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);
    if (!user.twoFactorSecret) return sendResponse(res, false, {}, '2FA not configured', 400);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) return sendResponse(res, false, {}, 'Invalid TOTP token', 401);

    // Mark 2FA enabled
    user.isTwoFactorEnabled = true;
    await user.save();

    return sendResponse(res, true, {}, '2FA verified and enabled');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, {}, '2FA verification failed', 500);
  }
};
