const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
const PDFDocument = require('pdfkit');
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

// GET paginated delivery report for a campaign
exports.getDeliveryReport = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { campaignId } = req.params;
    const { page = 1, limit = 100, status, from, to } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || String(campaign.organizationId) !== String(user.organizationId)) return sendResponse(res, false, {}, 'Campaign not found', 404);

    const filter = { campaignId };
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const msgs = await Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Message.countDocuments(filter);

    // enrich with contact info
    const contactIds = msgs.map((m) => m.contactId).filter(Boolean);
    const contacts = await Contact.find({ _id: { $in: contactIds } }).lean();
    const contactMap = {};
    contacts.forEach((c) => { contactMap[c._id] = c; });

    const rows = msgs.map((m) => ({
      id: m._id,
      contactName: (contactMap[m.contactId] && contactMap[m.contactId].name) || null,
      phone: (contactMap[m.contactId] && contactMap[m.contactId].phoneNumber) || null,
      status: m.status,
      sentAt: m.sentAt,
      deliveredAt: m.deliveredAt,
      readAt: m.readAt,
      errorReason: m.errorReason,
    }));

    return sendResponse(res, true, { rows, meta: { total, page: Number(page), limit: Number(limit) } }, 'Delivery report');
  } catch (err) {
    console.error('getDeliveryReport error:', err);
    return sendResponse(res, false, {}, 'Failed to get delivery report', 500);
  }
};

// Stream CSV export of delivery report
exports.exportDeliveryReportCSV = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { campaignId } = req.params;
    const { status, from, to } = req.query;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || String(campaign.organizationId) !== String(user.organizationId)) return res.status(404).send('Campaign not found');

    const filter = { campaignId };
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="delivery_report_${campaignId}.csv"`);

    // stream in batches
    const cursor = Message.find(filter).cursor();
    const parser = new Parser({ fields: ['_id','contactName','phone','status','sentAt','deliveredAt','readAt','errorReason'] });

    // We'll manually write CSV headers then rows
    let first = true;
    for await (const m of cursor) {
      const contact = await Contact.findById(m.contactId).lean();
      const row = {
        _id: m._id,
        contactName: contact ? contact.name : '',
        phone: contact ? contact.phoneNumber : '',
        status: m.status,
        sentAt: m.sentAt,
        deliveredAt: m.deliveredAt,
        readAt: m.readAt,
        errorReason: m.errorReason || '',
      };
      if (first) {
        res.write(parser.parse([row]) + '\n');
        first = false;
      } else {
        // json2csv only generates headers for arrays; for rows we can generate and strip header
        const csv = parser.parse([row]);
        const lines = csv.split('\n');
        // drop header
        lines.shift();
        res.write(lines.join('\n') + '\n');
      }
    }

    res.end();
  } catch (err) {
    console.error('exportDeliveryReportCSV error:', err);
    return res.status(500).send('Export failed');
  }
};

// Export PDF using pdfkit
exports.exportDeliveryReportPDF = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { campaignId } = req.params;
    const { status, from, to } = req.query;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || String(campaign.organizationId) !== String(user.organizationId)) return res.status(404).send('Campaign not found');

    const filter = { campaignId };
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const msgs = await Message.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
    const total = msgs.length;
    const sent = msgs.filter((m) => m.status === 'sent').length;
    const delivered = msgs.filter((m) => m.status === 'delivered').length;
    const read = msgs.filter((m) => m.status === 'read').length;
    const failed = msgs.filter((m) => m.status === 'failed').length;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="delivery_report_${campaignId}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text(process.env.COMPANY_NAME || 'Company', { align: 'left' });
    doc.fontSize(12).text(`Campaign Delivery Report: ${campaign.name || campaignId}`, { align: 'left' });
    doc.moveDown();

    // Summary table
    doc.fontSize(10).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.text(`Total messages: ${total}`);
    doc.text(`Sent: ${sent}`);
    doc.text(`Delivered: ${delivered}`);
    doc.text(`Read: ${read}`);
    doc.text(`Failed: ${failed}`);
    doc.moveDown();

    // Detailed table header
    doc.fontSize(10).text('Messages', { underline: true });
    doc.moveDown(0.5);

    // Table columns: Contact, Phone, Status, SentAt, DeliveredAt, ReadAt, Error
    const tableTop = doc.y;
    const colWidths = [120, 100, 60, 80, 80, 80, 120];
    // header row
    doc.font('Helvetica-Bold');
    doc.text('Contact', { continued: true, width: colWidths[0] });
    doc.text('Phone', { continued: true, width: colWidths[1] });
    doc.text('Status', { continued: true, width: colWidths[2] });
    doc.text('SentAt', { continued: true, width: colWidths[3] });
    doc.text('DeliveredAt', { continued: true, width: colWidths[4] });
    doc.text('ReadAt', { continued: true, width: colWidths[5] });
    doc.text('Error', { width: colWidths[6] });
    doc.font('Helvetica');

    for (const m of msgs) {
      const contact = await Contact.findById(m.contactId).lean();
      const row = [contact ? contact.name : '', contact ? contact.phoneNumber : '', m.status, m.sentAt ? m.sentAt.toISOString() : '', m.deliveredAt ? m.deliveredAt.toISOString() : '', m.readAt ? m.readAt.toISOString() : '', m.errorReason || ''];
      // render row
      for (let i = 0; i < row.length; i++) {
        doc.text(String(row[i] || ''), { continued: i < row.length - 1, width: colWidths[i] });
      }
      doc.moveDown(0.5);
      if (doc.y > 720) doc.addPage();
    }

    doc.end();
  } catch (err) {
    console.error('exportDeliveryReportPDF error:', err);
    return res.status(500).send('PDF export failed');
  }
};

// get opt-out report
exports.getOptOutReport = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    const { page = 1, limit = 100 } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const docs = await Contact.find({ organizationId: user.organizationId, optInStatus: 'opted_out' }).sort({ optOutTimestamp: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Contact.countDocuments({ organizationId: user.organizationId, optInStatus: 'opted_out' });

    const rows = docs.map((c) => ({ id: c._id, name: c.name, phone: c.phoneNumber, reason: c.optOutReason, timestamp: c.optOutTimestamp }));
    return sendResponse(res, true, { rows, meta: { total, page: Number(page), limit: Number(limit) } }, 'Opt-out report');
  } catch (err) {
    console.error('getOptOutReport error:', err);
    return sendResponse(res, false, {}, 'Failed to get opt-out report', 500);
  }
};

// export opt-out CSV
exports.exportOptOutCSV = async (req, res) => {
  try {
    const user = requireUser(req, res); if (!user) return;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="opt_outs.csv"`);

    const cursor = Contact.find({ organizationId: user.organizationId, optInStatus: 'opted_out' }).cursor();
    const parser = new Parser({ fields: ['_id','name','phone','reason','timestamp'] });
    let first = true;
    for await (const c of cursor) {
      const row = { _id: c._id, name: c.name, phone: c.phoneNumber, reason: c.optOutReason || '', timestamp: c.optOutTimestamp };
      if (first) { res.write(parser.parse([row]) + '\n'); first = false; } else { const csv = parser.parse([row]); const lines = csv.split('\n'); lines.shift(); res.write(lines.join('\n') + '\n'); }
    }
    res.end();
  } catch (err) {
    console.error('exportOptOutCSV error:', err);
    return res.status(500).send('Export failed');
  }
};
