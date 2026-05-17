const ROLE_HIERARCHY = {
  viewer: 1,
  agent: 2,
  manager: 3,
  admin: 4,
  owner: 5,
  super_admin: 6,
};

/**
 * Check if a user's role satisfies the required minimum role in the hierarchy.
 *
 * @param {string} userRole - The role of the current user.
 * @param {string|Array<string>} requiredRoles - Either a single minimum role required (checks hierarchy)
 *                                               OR an array of explicit exact roles allowed.
 * @returns {boolean} True if the user satisfies the permission requirement.
 */
export const hasPermission = (userRole, requiredRoles) => {
  if (!userRole) return false;
  if (userRole === 'super_admin') return true;

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }

  // If a single string is provided, assume it's a minimum role check
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const reqLevel = ROLE_HIERARCHY[requiredRoles] || 0;

  return userLevel >= reqLevel;
};
