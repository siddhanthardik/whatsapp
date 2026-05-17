const User = require('../models/User');
const Subscription = require('../models/Subscription');
const bcrypt = require('bcryptjs');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// List users: super_admin can list all, owner/admin/manager can list org users
exports.listUsers = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { page = 1, limit = 25, search, role, isActive, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const query = {};
    if (requester.role !== 'super_admin') {
      query.organizationId = requester.organizationId;
    }
    if (role) query.role = role;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true' || isActive === '1';
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: re }, { email: re }];
    }

    const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query).select('-password -twoFactorSecret -refreshTokens').sort(sort).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return sendResponse(res, true, { users, meta: { total, page: Number(page), limit: Number(limit) } }, 'Users retrieved');
  } catch (err) {
    console.error('listUsers error:', err);
    return sendResponse(res, false, {}, 'Failed to list users', 500);
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId).select('-password -twoFactorSecret -refreshTokens');
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    // Allow if requester is the same user
    if (requester.id === String(user._id)) {
      return sendResponse(res, true, { user }, 'User retrieved');
    }

    // Allow super_admin always
    if (requester.role === 'super_admin') {
      return sendResponse(res, true, { user }, 'User retrieved');
    }

    // Must be in same org to view
    if (String(requester.organizationId) === String(user.organizationId)) {
      return sendResponse(res, true, { user }, 'User retrieved');
    }

    return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);
  } catch (err) {
    console.error('getUser error:', err);
    return sendResponse(res, false, {}, 'Failed to get user', 500);
  }
};

// Update user - RBAC logic applied
exports.updateUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    const isSelf = requester.id === String(user._id);
    const isSuper = requester.role === 'super_admin';
    const sameOrg = String(requester.organizationId) === String(user.organizationId);

    if (!isSuper && !sameOrg) {
      return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);
    }

    // Define permissions
    const canManageRoles = isSuper || (sameOrg && requester.role === 'owner') || (sameOrg && requester.role === 'admin');
    
    // Admin cannot modify owner
    if (!isSuper && !isSelf && user.role === 'owner' && requester.role === 'admin') {
      return sendResponse(res, false, {}, 'Admins cannot modify owner accounts', 403);
    }

    // Owner cannot downgrade themselves
    if (isSelf && req.body.role && req.body.role !== 'owner' && user.role === 'owner') {
      return sendResponse(res, false, {}, 'Owner cannot downgrade their own role', 400);
    }

    // Ensure users cannot change their own roles unless they are owner/admin updating someone else
    if (req.body.role && !canManageRoles) {
      delete req.body.role;
    }

    // Allowed updates for non-admins: name, email, password (self only)
    const allowSelfFields = ['name', 'email', 'password'];
    const adminFields = ['role', 'organizationId', 'isActive', 'isTwoFactorEnabled'];

    // Apply updates
    Object.keys(req.body).forEach((key) => {
      if (isSelf && allowSelfFields.includes(key)) {
        user[key] = req.body[key];
      } else if (canManageRoles && allowSelfFields.concat(adminFields).includes(key)) {
        user[key] = req.body[key];
      }
    });

    await user.save();
    const out = user.toObject();
    delete out.password;
    delete out.twoFactorSecret;
    delete out.refreshTokens;

    return sendResponse(res, true, { user: out }, 'User updated');
  } catch (err) {
    console.error('updateUser error:', err);
    return sendResponse(res, false, {}, 'Failed to update user', 500);
  }
};

// Delete user - allow super_admin, or owner/admin for same org
exports.deleteUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    const isSelf = requester.id === String(user._id);
    const isSuper = requester.role === 'super_admin';
    const sameOrg = String(requester.organizationId) === String(user.organizationId);

    if (!isSuper && !sameOrg) {
      return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);
    }

    if (isSelf) {
      return sendResponse(res, false, {}, 'You cannot delete yourself', 400);
    }

    if (user.role === 'owner' && !isSuper) {
       return sendResponse(res, false, {}, 'Owner cannot be deleted by org members', 403);
    }

    const canDelete = isSuper || requester.role === 'owner' || requester.role === 'admin';
    if (!canDelete) {
      return sendResponse(res, false, {}, 'Forbidden: insufficient permissions to delete users', 403);
    }

    await User.findByIdAndDelete(targetId);
    
    if (sameOrg) {
      await Subscription.updateOne(
        { organizationId: user.organizationId },
        { $inc: { currentUsers: -1 } }
      );
    }

    return sendResponse(res, true, {}, 'User deleted');
  } catch (err) {
    console.error('deleteUser error:', err);
    return sendResponse(res, false, {}, 'Failed to delete user', 500);
  }
};

// Create / Invite user (scoped to org)
exports.createUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return sendResponse(res, false, {}, 'Name, email, and password required', 400);

    const orgId = requester.organizationId;
    if (!orgId) return sendResponse(res, false, {}, 'Requester organization missing', 400);

    // Enforce limits
    const sub = await Subscription.findOne({ organizationId: orgId, status: 'active' });
    if (sub && sub.currentUsers >= sub.maxUsers) {
      return res.status(402).json({ success: false, code: 'PLAN_LIMIT_REACHED', message: 'User limit reached. Upgrade your plan.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return sendResponse(res, false, {}, 'Email already registered', 409);

    // Only owner/admin can invite others
    const validRoles = ['viewer', 'agent', 'manager', 'admin'];
    let assignedRole = validRoles.includes(role) ? role : 'agent';
    
    if (assignedRole === 'admin' && requester.role !== 'owner' && requester.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Only owner can assign admin role', 403);
    }

    const user = new User({
      name,
      email,
      password,
      role: assignedRole,
      organizationId: orgId
    });

    await user.save();
    
    await Subscription.updateOne(
      { organizationId: orgId },
      { $inc: { currentUsers: 1 } }
    );

    const out = user.toObject();
    delete out.password;
    return sendResponse(res, true, { user: out }, 'User created successfully', 201);
  } catch (err) {
    console.error('createUser error:', err);
    return sendResponse(res, false, {}, 'Failed to create user', 500);
  }
};
