const ContactGroup = require('../models/ContactGroup');
const User = require('../models/User');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

/**
 * Helper: resolve organizationId from req.user.
 * organizationId is the tenant key in this codebase (equivalent to companyId).
 */
async function resolveOrgId(user) {
  if (user.organizationId) return String(user.organizationId);
  // Fallback: load from DB if token did not include it
  const userDoc = await User.findById(user.id).select('organizationId');
  return (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
}

// ─── GET /api/contact-groups ─────────────────────────────────────────────────
// Returns all groups for the authenticated user's organization.
exports.getContactGroups = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const orgId = await resolveOrgId(user);
    if (!orgId) return sendResponse(res, false, {}, 'Organization not found for user', 400);

    const groups = await ContactGroup.find({ organizationId: orgId }).sort({ name: 1 });
    return sendResponse(res, true, { groups }, 'Contact groups retrieved');
  } catch (err) {
    console.error('getContactGroups error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve contact groups', 500);
  }
};

// ─── GET /api/contact-groups/check-name?name=GROUP_NAME ─────────────────────
// Real-time name availability check scoped to the authenticated organization.
exports.checkGroupName = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const name = (req.query.name || '').trim();
    if (!name) return res.json({ exists: false, message: 'No name provided' });

    const orgId = await resolveOrgId(user);
    if (!orgId) return sendResponse(res, false, {}, 'Organization not found for user', 400);

    const existing = await ContactGroup.findOne({ organizationId: orgId, name });
    if (existing) {
      return res.json({ exists: true, message: 'Group already exists in your organization' });
    }
    return res.json({ exists: false, message: 'Group name available' });
  } catch (err) {
    console.error('checkGroupName error:', err);
    return sendResponse(res, false, {}, 'Name check failed', 500);
  }
};

// ─── POST /api/contact-groups ─────────────────────────────────────────────────
// Creates a new contact group, scoped to the authenticated organization.
exports.createContactGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { name, description, color, isActive } = req.body;
    const trimmedName = (name || '').trim();
    if (!trimmedName) return sendResponse(res, false, {}, 'Group name is required', 400);

    const orgId = await resolveOrgId(user);
    if (!orgId) return sendResponse(res, false, {}, 'Organization not found for user', 400);

    // Case-insensitive duplicate check scoped to organization
    const existing = await ContactGroup.findOne({
      organizationId: orgId,
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existing) {
      return sendResponse(res, false, {}, 'A group with this name already exists in your organization', 409);
    }

    const group = new ContactGroup({
      name: trimmedName,
      description: description || '',
      color: color || '#10B981',
      isActive: isActive !== undefined ? isActive : true,
      organizationId: orgId,   // always server-side; never trust frontend
      createdBy: user.id,
    });

    await group.save();
    return sendResponse(res, true, { group }, 'Contact group created', 201);
  } catch (err) {
    // Handle MongoDB duplicate key error (race condition)
    if (err.code === 11000) {
      return sendResponse(res, false, {}, 'A group with this name already exists in your organization', 409);
    }
    console.error('createContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to create contact group', 500);
  }
};

// ─── PUT /api/contact-groups/:id ─────────────────────────────────────────────
exports.updateContactGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    const group = await ContactGroup.findById(id);
    if (!group) return sendResponse(res, false, {}, 'Group not found', 404);

    // Tenant isolation: only super_admin can touch other orgs
    if (user.role !== 'super_admin' && String(group.organizationId) !== String(user.organizationId)) {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    if (name) {
      const trimmedName = name.trim();
      if (trimmedName !== group.name) {
        const existing = await ContactGroup.findOne({
          organizationId: group.organizationId,
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          _id: { $ne: group._id },
        });
        if (existing) return sendResponse(res, false, {}, 'A group with this name already exists in your organization', 409);
        group.name = trimmedName;
      }
    }

    if (description !== undefined) group.description = description;
    if (color !== undefined) group.color = color;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();
    return sendResponse(res, true, { group }, 'Contact group updated');
  } catch (err) {
    if (err.code === 11000) {
      return sendResponse(res, false, {}, 'A group with this name already exists in your organization', 409);
    }
    console.error('updateContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to update contact group', 500);
  }
};

// ─── DELETE /api/contact-groups/:id ──────────────────────────────────────────
exports.deleteContactGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const group = await ContactGroup.findById(id);
    if (!group) return sendResponse(res, false, {}, 'Group not found', 404);

    if (user.role !== 'super_admin' && String(group.organizationId) !== String(user.organizationId)) {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    await ContactGroup.findByIdAndDelete(id);

    // Remove this group from any contacts in the same org (safety scoped)
    const Contact = require('../models/Contact');
    await Contact.updateMany(
      { organizationId: group.organizationId, groupIds: id },
      { $pull: { groupIds: id } }
    );

    return sendResponse(res, true, {}, 'Contact group deleted');
  } catch (err) {
    console.error('deleteContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to delete contact group', 500);
  }
};
