const jwt = require('jsonwebtoken');
const User = require('../models/User');

function sendError(res, status, message) {
  return res.status(status).json({ success: false, data: {}, message });
}

/**
 * verifyToken - middleware to validate JWT from Authorization header and populate req.user
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access token missing');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return sendError(res, 401, 'Invalid or expired token');
    }

    // Prefer organizationId from token if provided (avoids extra DB lookup).
    // Ensure req.user.organizationId is always present: if missing in token, load from DB.
    let userObj = { id: String(payload.id), role: payload.role || 'support_agent', organizationId: payload.organizationId || null };

    if (!userObj.organizationId) {
      // Lookup user to get organizationId and validate existence
      const userDoc = await User.findById(payload.id).select('-password -twoFactorSecret -refreshTokens');
      if (!userDoc) return sendError(res, 401, 'User not found');
      userObj = { id: String(userDoc._id), role: userDoc.role, organizationId: userDoc.organizationId || null, name: userDoc.name, isActive: userDoc.isActive };
    }

    req.user = userObj;
    return next();
  } catch (err) {
    console.error('verifyToken error:', err);
    return sendError(res, 500, 'Authentication failed');
  }
}

/**
 * requireRole(...roles) - middleware factory that checks if user has one of allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return sendError(res, 401, 'Authentication required');
      if (!roles.includes(user.role)) return sendError(res, 403, 'Insufficient permissions');
      return next();
    } catch (err) {
      console.error('requireRole error:', err);
      return sendError(res, 500, 'Authorization failed');
    }
  };
}

/**
 * requireOrgAccess - ensures user can only access their own organization's data.
 * Bypasses check for `super_admin` role. Looks for target organization id in
 * req.params.organizationId | req.params.orgId | req.body.organizationId | req.query.organizationId
 */
function requireOrgAccess(req, res, next) {
  try {
    const user = req.user;
    if (!user) return sendError(res, 401, 'Authentication required');

    if (user.role === 'super_admin') return next();

    const targetOrgId =
      (req.params && (req.params.organizationId || req.params.orgId || req.params.id)) ||
      req.body.organizationId ||
      req.query.organizationId;

    if (!targetOrgId) {
      // If route doesn't provide an organization id, allow and expect controllers to enforce
      return next();
    }

    const userOrgId = (user.organizationId || '').toString();
    if (userOrgId !== String(targetOrgId)) return sendError(res, 403, 'Forbidden: organization access denied');

    return next();
  } catch (err) {
    console.error('requireOrgAccess error:', err);
    return sendError(res, 500, 'Authorization failed');
  }
}

module.exports = { verifyToken, requireRole, requireOrgAccess };
