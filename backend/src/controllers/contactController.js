const { parse } = require('csv-parse/sync');
const Contact = require('../models/Contact');
const User = require('../models/User');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

function normalizePhone(phone) {
  if (!phone) return null;
  let s = String(phone).trim();
  // remove everything except digits and plus
  let cleaned = s.replace(/[^\d+]/g, '');
  
  // if starts with digits but no +, prepend +
  if (/^\d{7,15}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  // ensure starts with + and digits
  if (!/^\+\d{7,15}$/.test(cleaned)) return null;
  return cleaned;
}

// importContacts: expects multer to provide req.file (CSV), parses and bulk inserts scoped to req.user.organizationId
exports.importContacts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    // ensure we have organizationId
    let orgId = user.organizationId || null;
    if (!orgId) {
      const userDoc = await User.findById(user.id).select('organizationId');
      orgId = (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
    }

    if (!req.file || !req.file.buffer) return sendResponse(res, false, {}, 'CSV file is required', 400);

    const csvText = req.file.buffer.toString('utf8');
    const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    console.log('[importContacts] Parsed records length:', records.length);
    console.log('[importContacts] Records sample:', JSON.stringify(records.slice(0, 2), null, 2));
    if (!records || !records.length) return sendResponse(res, false, {}, 'No rows in CSV', 400);

    // allow client-provided mapping (file header -> target field)
    let clientMapping = null;
    let reqGroups = [];
    let reqTags = [];
    try {
      if (req.body && req.body.mapping) {
        clientMapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
        console.log('[importContacts] Received mapping:', clientMapping);
      }
      if (req.body && req.body.groupIds) {
        reqGroups = typeof req.body.groupIds === 'string' ? JSON.parse(req.body.groupIds) : req.body.groupIds;
      }
      if (req.body && req.body.tags) {
        reqTags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      }
    } catch (e) {
      console.error('[importContacts] Error parsing req.body JSON fields:', e);
    }

    // normalized rows
    const normalized = records.map((row) => {
      // if client mapping provided, use it
      if (clientMapping && Object.keys(clientMapping).length) {
        let phone = null; let name = null; let email = null; let tags = [];
        // Create a normalized version of the row for easier lookup (lowercase keys)
        const rowLower = {};
        for (const k of Object.keys(row)) {
          rowLower[k.toLowerCase().trim()] = row[k];
        }

        for (const fileHeader of Object.keys(clientMapping)) {
          const mapped = clientMapping[fileHeader];
          // Try exact match first, then lowercase match
          const val = row[fileHeader] || rowLower[fileHeader.toLowerCase().trim()];
          
          if (!val) continue;
          const target = String(mapped).toLowerCase();
          
          if (target === 'phone' || target === 'phonenumber') phone = val;
          else if (target === 'name' || target === 'fullname') name = val;
          else if (target === 'email') email = val;
          else if (target === 'tag' || target === 'tags') {
            const newTags = String(val).split(/[,;|]/).map(t=>t.trim()).filter(Boolean);
            tags = tags.concat(newTags);
          }
        }
        return { phone, name, email, tags, raw: row };
      }

      // auto-map headers: find common header names
      const lower = Object.keys(row).reduce((acc, k) => {
        acc[k.toLowerCase().trim()] = row[k];
        return acc;
      }, {});

      // phone detection
      const phoneKeys = ['phone', 'phonenumber', 'phone_number', 'msisdn', 'number', 'mobile'];
      let phone = null;
      for (const k of phoneKeys) if (lower[k]) { phone = lower[k]; break; }

      const nameKeys = ['name', 'full name', 'fullname'];
      let name = null;
      for (const k of nameKeys) if (lower[k]) { name = lower[k]; break; }

      const emailKeys = ['email', 'e-mail'];
      let email = null;
      for (const k of emailKeys) if (lower[k]) { email = lower[k]; break; }

      // tags may be comma-separated
      const tagKeys = ['tags', 'tag'];
      let tags = [];
      for (const k of tagKeys) if (lower[k]) { tags = String(lower[k]).split(/[,;|]/).map(t => t.trim()).filter(Boolean); break; }

      return { phone, name, email, tags, raw: row };
    });

    // Validate phone numbers and prepare docs
    const docs = [];
    const filePhones = new Set();
    const invalidRows = [];
    for (let i = 0; i < normalized.length; i++) {
      const r = normalized[i];
      const normalizedPhone = normalizePhone(r.phone);
      if (!normalizedPhone) {
        invalidRows.push({ row: i + 1, reason: 'Invalid phone', raw: r.raw });
        continue;
      }
      if (filePhones.has(normalizedPhone)) {
        // duplicate in file
        continue;
      }
      filePhones.add(normalizedPhone);
      docs.push({
        phoneNumber: normalizedPhone,
        name: r.name || undefined,
        email: r.email || undefined,
        tags: Array.from(new Set([...(r.tags || []), ...reqTags])),
        groups: reqGroups,
        customFields: r.raw || {},
        organizationId: orgId,
        optInStatus: 'opted_in',
        optInSource: 'csv_import',
        optInTimestamp: new Date(),
      });
    }

    if (!docs.length) return sendResponse(res, false, { invalidRows }, 'No valid contacts to import', 400);

    // Detect existing contacts in DB by phone
    const phones = Array.from(filePhones);
    const existing = await Contact.find({ phoneNumber: { $in: phones }, organizationId: orgId }).select('phoneNumber');
    const existingSet = new Set(existing.map(e => e.phoneNumber));

    const toInsert = docs.filter(d => !existingSet.has(d.phoneNumber));
    const duplicateDocs = docs.filter(d => existingSet.has(d.phoneNumber));
    const duplicates = duplicateDocs.map(d => d.phoneNumber);

    const errors = [];
    let inserted = [];
    if (toInsert.length) {
      try {
        inserted = await Contact.insertMany(toInsert, { ordered: false });
      } catch (e) {
        console.error('insertMany error:', e);
        // collect writeErrors if present
        if (e && e.writeErrors && Array.isArray(e.writeErrors)) {
          for (const we of e.writeErrors) {
            errors.push({ index: we.index, errmsg: we.errmsg });
          }
        } else if (e && e.message) {
          errors.push({ errmsg: e.message });
        }
      }
    }

    if (duplicateDocs.length) {
      try {
        const bulkOps = duplicateDocs.map(d => {
          const updateFields = {};
          if (d.name) updateFields.name = d.name;
          if (d.email) updateFields.email = d.email;
          return {
            updateOne: {
              filter: { phoneNumber: d.phoneNumber, organizationId: orgId },
              update: {
                $addToSet: { tags: { $each: d.tags }, groups: { $each: d.groups } },
                ...(Object.keys(updateFields).length > 0 ? { $set: updateFields } : {})
              }
            }
          };
        });
        await Contact.bulkWrite(bulkOps, { ordered: false });
      } catch (err) {
        console.error('bulkWrite error for duplicates:', err);
      }
    }

    return sendResponse(res, true, { imported: inserted.length || 0, duplicates: duplicates.length, errors, invalidRows }, 'Import completed');
  } catch (err) {
    console.error('importContacts error:', err);
    return sendResponse(res, false, {}, 'Failed to import contacts', 500);
  }
};

// createContact - single contact creation scoped to user's org
exports.createContact = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { phoneNumber, name, email, customFields, tags = [], lists } = req.body;
    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) return sendResponse(res, false, {}, 'Invalid phone number (E.164 required)', 400);
    // resolve organizationId
    let orgId = user.organizationId || null;
    if (!orgId) {
      const userDoc = await User.findById(user.id).select('organizationId');
      orgId = (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
    }

    // check duplicate
    const existing = await Contact.findOne({ phoneNumber: normalizedPhone, organizationId: orgId });
    if (existing) return sendResponse(res, false, {}, 'Contact already exists', 409);

    const contact = new Contact({
      phoneNumber: normalizedPhone,
      name,
      email,
      customFields: customFields || {},
      tags: Array.isArray(tags) ? tags : [tags],
      lists: lists || [],
      organizationId: orgId,
      optInStatus: 'opted_in',
      optInSource: 'manual',
      optInTimestamp: new Date(),
    });
    await contact.save();
    return sendResponse(res, true, { contact }, 'Contact created', 201);
  } catch (err) {
    console.error('createContact error:', err);
    return sendResponse(res, false, {}, 'Failed to create contact', 500);
  }
};

// updateContact - ownership: must belong to user's org, or super_admin can update any
exports.updateContact = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return sendResponse(res, false, {}, 'Contact not found', 404);

    if (user.role !== 'super_admin' && String(contact.organizationId) !== String(user.organizationId)) {
      return sendResponse(res, false, {}, 'Forbidden: organization access denied', 403);
    }

    const updatable = ['name', 'email', 'customFields', 'tags', 'lists', 'optInStatus', 'optInTimestamp', 'optOutTimestamp', 'optOutReason', 'isBlocked'];
    updatable.forEach((key) => {
      if (typeof req.body[key] !== 'undefined') contact[key] = req.body[key];
    });

    // allow phone number update if normalized and not duplicate
    if (req.body.phoneNumber) {
      const normalizedPhone = normalizePhone(req.body.phoneNumber);
      if (!normalizedPhone) return sendResponse(res, false, {}, 'Invalid phone number', 400);
      const duplicate = await Contact.findOne({ phoneNumber: normalizedPhone, organizationId: user.organizationId, _id: { $ne: contact._id } });
      if (duplicate) return sendResponse(res, false, {}, 'Another contact with this phone exists', 409);
      contact.phoneNumber = normalizedPhone;
    }

    await contact.save();
    return sendResponse(res, true, { contact }, 'Contact updated');
  } catch (err) {
    console.error('updateContact error:', err);
    return sendResponse(res, false, {}, 'Failed to update contact', 500);
  }
};

// deleteContact - scoped to org
exports.deleteContact = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return sendResponse(res, false, {}, 'Contact not found', 404);

    if (user.role !== 'super_admin' && String(contact.organizationId) !== String(user.organizationId)) {
      return sendResponse(res, false, {}, 'Forbidden: organization access denied', 403);
    }

    await Contact.findByIdAndDelete(id);
    return sendResponse(res, true, {}, 'Contact deleted');
  } catch (err) {
    console.error('deleteContact error:', err);
    return sendResponse(res, false, {}, 'Failed to delete contact', 500);
  }
};

// getContacts - pagination, search, filter by tag/list/optInStatus
exports.getContacts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    // simple org resolution: prefer req.user.organizationId, otherwise read from DB
    let orgId = user.organizationId || null;
    if (!orgId) {
      try {
        const userDoc = await User.findById(user.id).select('organizationId');
        orgId = (userDoc && userDoc.organizationId) ? String(userDoc.organizationId) : null;
      } catch (e) {
        console.error('Failed to lookup user organizationId:', e);
      }
    }

    const query = orgId ? { organizationId: orgId } : {};

    // limit results to 200; always return 200 and an array
    const contacts = await Contact.find(query).limit(200).lean();
    return res.status(200).json(contacts || []);
  } catch (err) {
    console.error('getContacts error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve contacts', 500);
  }
};

// GET /api/contacts/lists
// Groups contacts by tag and by list id (if lists exist). Returns array of groups:
// { id, name, count, optIn }
exports.getContactLists = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const orgId = user.organizationId || null;

    // total counts (include orphaned contacts with null org as fallback)
    const totalCount = await Contact.countDocuments({ organizationId: { $in: [orgId, null] } });
    const optInCount = await Contact.countDocuments({ organizationId: { $in: [orgId, null] }, optInStatus: 'opted_in' });

    // check if any contact has tags or lists
    const hasGroups = await Contact.exists({ organizationId: { $in: [orgId, null] }, $or: [{ tags: { $exists: true, $ne: [] } }, { lists: { $exists: true, $ne: [] } }] });

    if (!hasGroups) {
      return sendResponse(res, true, { groups: [{ id: 'all', name: 'All Contacts', count: totalCount, optIn: optInCount }] }, 'Contact groups');
    }

    const groups = [];

    // Group by tags
    const tagAgg = await Contact.aggregate([
      { $match: { $or: [{ organizationId: orgId }, { organizationId: null }], tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 }, optIn: { $sum: { $cond: [{ $eq: ['$optInStatus', 'opted_in'] }, 1, 0] } } } },
      { $project: { _id: 0, id: '$_id', name: '$_id', count: 1, optIn: 1 } },
      { $sort: { count: -1, name: 1 } },
    ]).exec();

    for (const t of tagAgg) groups.push(t);

    // Group by lists (list ids). If ContactList model exists later, we could lookup names.
    const listAgg = await Contact.aggregate([
      { $match: { $or: [{ organizationId: orgId }, { organizationId: null }], lists: { $exists: true, $ne: [] } } },
      { $unwind: '$lists' },
      { $group: { _id: '$lists', count: { $sum: 1 }, optIn: { $sum: { $cond: [{ $eq: ['$optInStatus', 'opted_in'] }, 1, 0] } } } },
      { $project: { _id: 0, id: { $toString: '$_id' }, name: { $toString: '$_id' }, count: 1, optIn: 1 } },
      { $sort: { count: -1 } },
    ]).exec();

    for (const l of listAgg) groups.push(l);

    // If both empty for some reason, return 'all'
    if (!groups.length) {
      return sendResponse(res, true, { groups: [{ id: 'all', name: 'All Contacts', count: totalCount, optIn: optInCount }] }, 'Contact groups');
    }

    return sendResponse(res, true, { groups }, 'Contact groups');
  } catch (err) {
    console.error('getContactLists error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve contact groups', 500);
  }
};

// GET /api/contacts/fields
// Returns a static list of field names available for variable mapping
exports.getContactFields = async (req, res) => {
  try {
    // Protected route; user validated by middleware
    const fields = ['Name', 'Phone', 'Email', 'City', 'Tag', 'Custom Field 1'];
    return sendResponse(res, true, { fields }, 'Contact fields');
  } catch (err) {
    console.error('getContactFields error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve contact fields', 500);
  }
};

// exportContacts - export matching contacts as CSV
exports.exportContacts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { search, tag, list, optInStatus } = req.query;
    const orgId = user.organizationId || null;
    const query = { organizationId: { $in: [orgId, null] } };
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: re }, { email: re }, { phoneNumber: re }];
    }
    if (tag) query.tags = tag;
    if (list) query.lists = list;
    if (optInStatus) query.optInStatus = optInStatus;

    const contacts = await Contact.find(query).lean();

    // Build CSV
    const headers = ['phoneNumber', 'name', 'email', 'tags', 'optInStatus', 'optInTimestamp', 'optOutTimestamp', 'optOutReason', 'isBlocked', 'createdAt', 'updatedAt'];
    const rows = contacts.map(c => headers.map(h => {
      let v = c[h];
      if (Array.isArray(v)) v = v.join(';');
      if (v === undefined || v === null) v = '';
      return String(v).replace(/"/g, '""');
    }).map(cell => `"${cell}"`).join(','));

    const csv = `${headers.join(',')}\n${rows.join('\n')}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('exportContacts error:', err);
    return sendResponse(res, false, {}, 'Failed to export contacts', 500);
  }
};
