const Contact = require('../models/Contact');
const AuditLog = require('../models/AuditLog');
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');
const { Parser } = require('json2csv');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

function requireUser(req, res) {
  const user = req.user;
  if (!user) {
    sendResponse(res, false, {}, 'Authentication required', 401);
    return null;
  }
  return user;
}

// GET paginated opted-in contacts
exports.getOptInList = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { page = 1, limit = 100, search } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const filter = { organizationId: user.organizationId, optInStatus: 'opted_in' };
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: re }, { phoneNumber: re }, { email: re }];
    }

    const rows = await Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Contact.countDocuments(filter);
    return sendResponse(res, true, { rows, meta: { total, page: Number(page), limit: Number(limit) } }, 'Opt-in list');
  } catch (err) {
    console.error('getOptInList error:', err);
    return sendResponse(res, false, {}, 'Failed to get opt-in list', 500);
  }
};

// GET opted-out contacts
exports.getOptOutList = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { page = 1, limit = 100, search } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const filter = { organizationId: user.organizationId, optInStatus: 'opted_out' };
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: re }, { phoneNumber: re }, { email: re }];
    }

    const rows = await Contact.find(filter).sort({ optOutTimestamp: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Contact.countDocuments(filter);
    return sendResponse(res, true, { rows, meta: { total, page: Number(page), limit: Number(limit) } }, 'Opt-out list');
  } catch (err) {
    console.error('getOptOutList error:', err);
    return sendResponse(res, false, {}, 'Failed to get opt-out list', 500);
  }
};

// Admin manually opt-out a contact
exports.manualOptOut = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { contactId } = req.params;
    const { reason = 'manual_opt_out' } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact || String(contact.organizationId) !== String(user.organizationId)) return sendResponse(res, false, {}, 'Contact not found', 404);

    contact.optInStatus = 'opted_out';
    contact.optOutTimestamp = new Date();
    contact.optOutReason = reason;
    await contact.save();

    await AuditLog.create({ action: 'manualOptOut', actor: user.id, targetType: 'Contact', targetId: contact._id, details: { reason }, organizationId: user.organizationId });

    return sendResponse(res, true, { contact }, 'Contact opted out');
  } catch (err) {
    console.error('manualOptOut error:', err);
    return sendResponse(res, false, {}, 'Failed to opt-out contact', 500);
  }
};

// Admin manually opt-in (re-opt-in) a contact
exports.manualOptIn = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { contactId } = req.params;
    const { source = 'manual' } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact || String(contact.organizationId) !== String(user.organizationId)) return sendResponse(res, false, {}, 'Contact not found', 404);

    contact.optInStatus = 'opted_in';
    contact.optInTimestamp = new Date();
    contact.optInSource = source;
    await contact.save();

    await AuditLog.create({ action: 'manualOptIn', actor: user.id, targetType: 'Contact', targetId: contact._id, details: { source }, organizationId: user.organizationId });

    return sendResponse(res, true, { contact }, 'Contact opted in');
  } catch (err) {
    console.error('manualOptIn error:', err);
    return sendResponse(res, false, {}, 'Failed to opt-in contact', 500);
  }
};

// Process web form opt-in: create contact if not exists, set pending, send double opt-in confirmation via WhatsApp
exports.processWebOptIn = async (req, res) => {
  try {
    const { phoneNumber, name = null, organizationId = null, source = 'web_form' } = req.body;
    if (!phoneNumber) return sendResponse(res, false, {}, 'phoneNumber required', 400);

    let contact = await Contact.findOne({ phoneNumber, organizationId: organizationId || null });
    if (!contact) {
      contact = await Contact.create({ phoneNumber, name, organizationId: organizationId || null, optInStatus: 'pending', optInSource: source, optInTimestamp: new Date() });
    } else {
      contact.optInStatus = 'pending';
      contact.optInSource = source;
      contact.optInTimestamp = new Date();
      await contact.save();
    }

    // send double opt-in confirmation via WhatsApp
    try {
      const text = `Hi ${contact.name || ''}, please reply YES to confirm subscription.`;
      await whatsappService.sendTextMessage(contact.phoneNumber, text);
      await AuditLog.create({ action: 'webOptInSent', actor: null, targetType: 'Contact', targetId: contact._id, details: { via: 'whatsapp' }, organizationId: contact.organizationId });
    } catch (err) {
      console.error('Failed sending opt-in confirmation:', err);
    }

    return sendResponse(res, true, { contact }, 'Opt-in processed (pending confirmation)');
  } catch (err) {
    console.error('processWebOptIn error:', err);
    return sendResponse(res, false, {}, 'Failed to process web opt-in', 500);
  }
};

// get opt-in stats
exports.getOptInStats = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const orgId = user.organizationId;

    const [optedIn, optedOut, pending] = await Promise.all([
      Contact.countDocuments({ organizationId: orgId, optInStatus: 'opted_in' }),
      Contact.countDocuments({ organizationId: orgId, optInStatus: 'opted_out' }),
      Contact.countDocuments({ organizationId: orgId, optInStatus: 'pending' }),
    ]);

    return sendResponse(res, true, { optedIn, optedOut, pending }, 'Opt-in stats');
  } catch (err) {
    console.error('getOptInStats error:', err);
    return sendResponse(res, false, {}, 'Failed to get opt-in stats', 500);
  }
};

// export opt-out list CSV
exports.exportOptOutList = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="opt_outs.csv"`);

    const cursor = Contact.find({ organizationId: user.organizationId, optInStatus: 'opted_out' }).cursor();
    const parser = new Parser({ fields: ['_id','name','phoneNumber','optOutReason','optOutTimestamp','optInSource'] });
    let first = true;
    for await (const c of cursor) {
      const row = { _id: c._id, name: c.name, phoneNumber: c.phoneNumber, optOutReason: c.optOutReason || '', optOutTimestamp: c.optOutTimestamp, optInSource: c.optInSource || '' };
      if (first) { res.write(parser.parse([row]) + '\n'); first = false; } else { const csv = parser.parse([row]); const lines = csv.split('\n'); lines.shift(); res.write(lines.join('\n') + '\n'); }
      await AuditLog.create({ action: 'exportOptOut', actor: user.id, targetType: 'Contact', details: { contactId: c._id }, organizationId: user.organizationId });
    }
    res.end();
  } catch (err) {
    console.error('exportOptOutList error:', err);
    return res.status(500).send('Export failed');
  }
};
