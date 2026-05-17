const sendResponse = (res, success, data = {}, message = '', status = 200) => {
  return res.status(status).json({ success, data, message });
};

/**
 * Middleware factory to enforce Role-Based Access Control (RBAC).
 * Expects req.user to be populated by the authentication middleware.
 * 
 * Hierarchy: owner > admin > manager > agent > viewer
 * 
 * @param  {...string} allowedRoles List of roles allowed to access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return sendResponse(res, false, {}, 'Authentication required', 401);
      }

      // super_admin overrides organization-level role checks
      if (user.role === 'super_admin') {
        return next();
      }

      if (!allowedRoles.includes(user.role)) {
        return sendResponse(res, false, {}, 'Insufficient permissions', 403);
      }

      next();
    } catch (err) {
      console.error('requireRole middleware error:', err);
      return sendResponse(res, false, {}, 'Server error during authorization', 500);
    }
  };
};

module.exports = { requireRole };
