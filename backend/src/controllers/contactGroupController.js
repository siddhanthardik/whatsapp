const ContactGroup = require('../models/ContactGroup');
const User = require('../models/User');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// Get all groups for the organization
exports.getContactGroups = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    let orgId = user.organizationId || null;
    if (!orgId) {
      const userDoc = await User.findById(user.id).select('organizationId');
      orgId = (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
    }

    const groups = await ContactGroup.find({ organizationId: orgId }).sort({ name: 1 });
    return sendResponse(res, true, { groups }, 'Contact groups retrieved');
  } catch (err) {
    console.error('getContactGroups error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve contact groups', 500);
  }
};

// Create a new group
exports.createContactGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { name, description, color, isActive } = req.body;
    
    let orgId = user.organizationId || null;
    if (!orgId) {
      const userDoc = await User.findById(user.id).select('organizationId');
      orgId = (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
    }

    // Check if group exists
    const existing = await ContactGroup.findOne({ organizationId: orgId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return sendResponse(res, false, {}, 'A group with this name already exists', 409);
    }

    const group = new ContactGroup({
      name,
      description,
      color,
      isActive: isActive !== undefined ? isActive : true,
      organizationId: orgId,
      createdBy: user.id
    });

    await group.save();
    return sendResponse(res, true, { group }, 'Contact group created', 201);
  } catch (err) {
    console.error('createContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to create contact group', 500);
  }
};

// Update a group
exports.updateContactGroup = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    const group = await ContactGroup.findById(id);
    if (!group) return sendResponse(res, false, {}, 'Group not found', 404);

    if (user.role !== 'super_admin' && String(group.organizationId) !== String(user.organizationId)) {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    if (name && name !== group.name) {
      const existing = await ContactGroup.findOne({ organizationId: group.organizationId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) return sendResponse(res, false, {}, 'A group with this name already exists', 409);
      group.name = name;
    }

    if (description !== undefined) group.description = description;
    if (color !== undefined) group.color = color;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();
    return sendResponse(res, true, { group }, 'Contact group updated');
  } catch (err) {
    console.error('updateContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to update contact group', 500);
  }
};

// Delete a group
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
    
    // Also remove this group from any contacts
    const Contact = require('../models/Contact');
    await Contact.updateMany(
      { groupIds: id },
      { $pull: { groupIds: id } }
    );

    return sendResponse(res, true, {}, 'Contact group deleted');
  } catch (err) {
    console.error('deleteContactGroup error:', err);
    return sendResponse(res, false, {}, 'Failed to delete contact group', 500);
  }
};
