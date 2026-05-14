const Organization = require('../models/Organization');
const User = require('../models/User');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// Get organization for current user
exports.getOrganization = async (req, res) => {
  try {
    console.log('[orgController] getOrganization called - user:', req.user && { id: req.user.id, role: req.user.role, organizationId: req.user.organizationId })
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    let orgId = user.organizationId || null;
    // super_admin may request org via query
    if (!orgId && user.role === 'super_admin' && req.query.orgId) orgId = req.query.orgId;

    if (!orgId) return sendResponse(res, false, {}, 'Organization not found', 404);

    const org = await Organization.findById(orgId).lean();
    if (!org) return sendResponse(res, false, {}, 'Organization not found', 404);

    return sendResponse(res, true, { organization: org }, 'Organization retrieved');
  } catch (err) {
    console.error('getOrganization error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve organization', 500);
  }
};

// Helper: find organization for a user (by organizationId or ownerId)
async function findOrgForUser(user) {
  if (!user) return null;
  if (user.organizationId) {
    const o = await Organization.findById(user.organizationId).lean();
    if (o) return o;
  }
  // fallback: ownerId
  const byOwner = await Organization.findOne({ ownerId: user.id }).lean();
  if (byOwner) return byOwner;
  return null;
}

// GET /api/organizations/me
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const org = await findOrgForUser(user);
    if (!org) return sendResponse(res, false, {}, 'Organization not found', 404);

    return sendResponse(res, true, { organization: org }, 'Organization retrieved');
  } catch (err) {
    console.error('getMe error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve organization', 500);
  }
};

// Update organization (only allowed for org admins or super_admin)
exports.updateOrganization = async (req, res) => {
  try {
    console.log('[orgController] updateOrganization called - user:', req.user && { id: req.user.id, role: req.user.role, organizationId: req.user.organizationId }, 'body:', req.body)
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    let orgId = user.organizationId || null;
    if (!orgId && user.role === 'super_admin' && req.body.organizationId) orgId = req.body.organizationId;
    if (!orgId) return sendResponse(res, false, {}, 'Organization id required', 400);

    const org = await Organization.findById(orgId);
    if (!org) return sendResponse(res, false, {}, 'Organization not found', 404);

    // Authorization: allow if super_admin or user's org matches
    if (user.role !== 'super_admin' && String(user.organizationId || '') !== String(org._id)) {
      return sendResponse(res, false, {}, 'Forbidden: organization access denied', 403);
    }

    const updatable = ['name', 'email', 'website', 'timezone', 'webhookUrl', 'metadata'];
    updatable.forEach((k) => {
      if (typeof req.body[k] !== 'undefined') org[k] = req.body[k];
    });

    await org.save();
    return sendResponse(res, true, { organization: org }, 'Organization updated');
  } catch (err) {
    console.error('updateOrganization error:', err);
    return sendResponse(res, false, {}, 'Failed to update organization', 500);
  }
};

// PATCH /api/organizations/me - partial update of current user's organization
exports.patchMe = async (req, res) => {
  try {
    console.log('[orgController] patchMe called - user:', req.user && { id: req.user.id, role: req.user.role, organizationId: req.user.organizationId }, 'body:', req.body)
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    // find the org to update (by orgId or ownerId)
    let org = null;
    if (user.organizationId) org = await Organization.findById(user.organizationId);
    if (!org) org = await Organization.findOne({ ownerId: user.id });
    
    // If no org exists, let's create it!
    if (!org) {
      org = new Organization({
        name: req.body.name || 'My Organization',
        ownerId: user.id,
      });
      await org.save();
      await User.findByIdAndUpdate(user.id, { organizationId: org._id });
    }

    // allowed updatable fields
    const updatable = ['name', 'website', 'timezone', 'language', 'address', 'phone', 'email', 'phoneId', 'webhookUrl', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpFrom', 'smtpPass', 'metadata'];
    let changed = false;
    updatable.forEach((k) => {
      if (typeof req.body[k] !== 'undefined') {
        org[k] = req.body[k];
        changed = true;
      }
    });

    if (!changed) return sendResponse(res, false, {}, 'No fields to update', 400);

    await org.save();
    return sendResponse(res, true, { organization: org.toObject() }, 'Organization updated');
  } catch (err) {
    console.error('patchMe error:', err);
    return sendResponse(res, false, {}, 'Failed to update organization', 500);
  }
};
