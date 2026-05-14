const { createQueue } = require('../config/redis');
const axios = require('axios');
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Contact = require('../models/Contact');

// REDIS_URL handled by createQueue
const WABA_TOKEN = process.env.WABA_TOKEN;
const WABA_PHONE_NUMBER_ID = process.env.WABA_PHONE_NUMBER_ID;

const queue = createQueue('campaign:messages');

// Simple processor: sends WhatsApp messages using template + contact
queue.process(async (job, done) => {
  try {
    const { campaignId, contactId, phoneNumber, templateId, personalizeVariables } = job.data;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return done(new Error('Campaign not found'));
    if (String(campaign.organizationId) !== String((job.data.organizationId || campaign.organizationId))) return done(new Error('Organization mismatch'));

    // if campaign is paused or cancelled, fail gracefully so job can be retried or removed
    if (campaign.status === 'paused') return done(new Error('Campaign paused'));
    if (['cancelled', 'completed'].includes(campaign.status)) return done(new Error('Campaign not active'));

    const contact = await Contact.findById(contactId);
    if (!contact) return done(new Error('Contact not found'));
    if (contact.optInStatus !== 'opted_in') return done(new Error('Contact not opted-in'));

    // Fetch template if provided (not mandatory)
    let template = null;
    if (templateId) template = await Template.findById(templateId);

    // Build message payload (simple text replacement for variables)
    let messageText = campaign.description || '';
    if (template && template.body) {
      messageText = template.body;
      // replace variables like {{name}}
      const vars = Object.assign({}, personalizeVariables || {}, { name: contact.name || '' });
      Object.keys(vars).forEach((k) => {
        const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
        messageText = messageText.replace(re, vars[k]);
      });
    }

    // Send via Meta WhatsApp API if configured
    if (WABA_TOKEN && WABA_PHONE_NUMBER_ID) {
      const url = `https://graph.facebook.com/v16.0/${WABA_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: messageText },
      };
      const headers = { Authorization: `Bearer ${WABA_TOKEN}` };

      try {
        const resp = await axios.post(url, payload, { headers });
        // update campaign stats
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.sent': 1 } }, { new: true, upsert: true });
        return done(null, resp.data);
      } catch (err) {
        console.error('WhatsApp send error:', err.response ? err.response.data : err.message);
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.failed': 1 } }, { new: true, upsert: true });
        return done(new Error('WhatsApp send failed'));
      }
    }

    // If no WABA configured, just simulate success
    await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.sent': 1 } }, { new: true, upsert: true });
    return done(null, { simulated: true });
  } catch (err) {
    console.error('Worker processing error:', err);
    // increment failed counter
    if (job && job.data && job.data.campaignId) {
      try {
        await Campaign.findByIdAndUpdate(job.data.campaignId, { $inc: { 'stats.failed': 1 } }, { new: true, upsert: true });
      } catch (e) {
        console.error('Failed updating campaign stats after worker error:', e);
      }
    }
    return done(err);
  }
});

queue.on('error', (err) => console.error('Campaign queue error:', err));
queue.on('failed', async (job, err) => {
  console.warn(`Job ${job.id} failed:`, err.message || err);
});
queue.on('completed', async (job, result) => {
  // optionally log
});

console.log('Campaign worker started, listening to queue: campaign:messages');
