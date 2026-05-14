const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');
const whatsapp = require('../services/whatsappService');
const Message = require('../models/Message');

router.post(
  '/send',
  verifyToken,
  requireRole('campaign_manager', 'support_agent', 'org_admin', 'super_admin'),
  async (req, res) => {
    try {
      const { to, type, text, template } = req.body;

      if (!to || !type) return res.status(400).json({ success: false, data: {}, message: 'to and type are required' });
      if (type === 'text' && !text?.body) return res.status(400).json({ success: false, data: {}, message: 'text.body is required for text messages' });
      if (type === 'template' && !template?.name) return res.status(400).json({ success: false, data: {}, message: 'template.name is required for template messages' });

      const payload = { to, type };
      if (type === 'text') payload.text = text;
      if (type === 'template') payload.template = { name: template.name, language: { code: template.language || 'en' }, components: template.components || [] };

      const metaResponse = await whatsapp.sendMessage(payload);
      const wamid = metaResponse.messages?.[0]?.id;

      const message = await Message.create({
        organizationId: req.user.organizationId,
        sentBy: req.user.id,
        to, type,
        ...(type === 'text' && { text }),
        ...(type === 'template' && { template }),
        status: 'accepted',
        wamid
      });

      return res.status(200).json({ success: true, data: { messageId: message._id, wamid }, message: 'Message sent successfully' });

    } catch (err) {
      const metaError = err.response?.data?.error?.message || err.message;
      console.error('Send message error:', metaError);
      return res.status(500).json({ success: false, data: {}, message: 'Failed to send message', error: metaError });
    }
  }
);

router.get('/', verifyToken, requireOrgAccess, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, to } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (to) filter.to = to;

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('sentBy', 'name email'),
      Message.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, data: { messages, total, page: Number(page), pages: Math.ceil(total / limit) } });

  } catch (err) {
    console.error('List messages error:', err);
    return res.status(500).json({ success: false, data: {}, message: 'Failed to fetch messages' });
  }
});

router.get('/:id', verifyToken, requireOrgAccess, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, organizationId: req.user.organizationId }).populate('sentBy', 'name email');
    if (!message) return res.status(404).json({ success: false, data: {}, message: 'Message not found' });
    return res.status(200).json({ success: true, data: message });
  } catch (err) {
    console.error('Get message error:', err);
    return res.status(500).json({ success: false, data: {}, message: 'Failed to fetch message' });
  }
});

module.exports = router;