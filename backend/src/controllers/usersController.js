const User = require('../models/User');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// List users: super_admin can list all, org_admin lists users in their organization
exports.listUsers = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);
    // Filters
    const { page = 1, limit = 25, search, role, isActive, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const query = {};
    if (requester.role === 'org_admin') {
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

// Get single user with ownership/admin check
exports.getUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId).select('-password -twoFactorSecret -refreshTokens');
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    // Allow if requester is the same user
    if (requester.id === user._id.toString()) {
      return sendResponse(res, true, { user }, 'User retrieved');
    }

    // Allow super_admin always
    if (requester.role === 'super_admin') {
      return sendResponse(res, true, { user }, 'User retrieved');
    }

    // Allow org_admin only for users in same organization
    if (requester.role === 'org_admin') {
      const reqOrg = (requester.organizationId || '').toString();
      const userOrg = (user.organizationId || '').toString();
      if (reqOrg && userOrg && reqOrg === userOrg) {
        return sendResponse(res, true, { user }, 'User retrieved');
      }
    }

    return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);
  } catch (err) {
    console.error('getUser error:', err);
    return sendResponse(res, false, {}, 'Failed to get user', 500);
  }
};

// Update user - ownership/admin checks
exports.updateUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    const isSelf = requester.id === user._id.toString();
    const isSuper = requester.role === 'super_admin';
    const isOrgAdmin = requester.role === 'org_admin' && String(requester.organizationId || '') === String(user.organizationId || '');

    if (!isSelf && !isSuper && !isOrgAdmin) return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);

    // Allowed updates for non-admins: name, email, password (self only)
    const allowSelfFields = ['name', 'email', 'password'];
    const adminFields = ['role', 'organizationId', 'isActive', 'isTwoFactorEnabled'];

    // Apply updates
    Object.keys(req.body).forEach((key) => {
      if (isSelf && allowSelfFields.includes(key)) {
        user[key] = req.body[key];
      } else if ((isSuper || isOrgAdmin) && (allowSelfFields.concat(adminFields).includes(key))) {
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

// Delete user - allow self-delete, super_admin, or org_admin for same org
exports.deleteUser = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return sendResponse(res, false, {}, 'Authentication required', 401);

    const targetId = req.params.id;
    if (!targetId) return sendResponse(res, false, {}, 'User id required', 400);

    const user = await User.findById(targetId);
    if (!user) return sendResponse(res, false, {}, 'User not found', 404);

    const isSelf = requester.id === user._id.toString();
    const isSuper = requester.role === 'super_admin';
    const isOrgAdmin = requester.role === 'org_admin' && String(requester.organizationId || '') === String(user.organizationId || '');

    if (!isSelf && !isSuper && !isOrgAdmin) return sendResponse(res, false, {}, 'Forbidden: insufficient permissions', 403);

    await User.findByIdAndDelete(targetId);
    return sendResponse(res, true, {}, 'User deleted');
  } catch (err) {
    console.error('deleteUser error:', err);
    return sendResponse(res, false, {}, 'Failed to delete user', 500);
  }
};
