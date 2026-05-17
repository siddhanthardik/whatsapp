const { createQueue } = require('../config/redis');
const axios = require('axios');
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const logger = require('../utils/logger');

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

    // Build message payload
    let payload;
    
    if (template && template.name) {
      // Build Meta Cloud API template payload
      const components = [];
      
      // We only support simple text variables in the BODY for now, but this can be extended
      if (template.body && template.body.variables && template.body.variables.length > 0) {
        const parameters = [];
        // The variables array contains standard placeholders like "1", "2"
        const vars = Object.assign({}, personalizeVariables || {}, { name: contact.name || '' });
        
        template.body.variables.forEach((v) => {
          // If the user provided a mapping for this variable, use it, else use fallback
          const val = vars[v] || `value_${v}`;
          parameters.push({ type: 'text', text: String(val) });
        });
        
        if (parameters.length > 0) {
          components.push({
            type: 'body',
            parameters
          });
        }
      }

      payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: template.name,
          language: {
            code: template.language || 'en_US'
          },
          components
        }
      };
    } else {
      // Fallback for non-template messages (e.g. standard session messages)
      let messageText = campaign.description || '';
      const vars = Object.assign({}, personalizeVariables || {}, { name: contact.name || '' });
      Object.keys(vars).forEach((k) => {
        const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
        messageText = messageText.replace(re, vars[k]);
      });
      
      payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: messageText },
      };
    }

    // Send via Meta WhatsApp API if configured
    if (WABA_TOKEN && WABA_PHONE_NUMBER_ID) {
      const url = `https://graph.facebook.com/v19.0/${WABA_PHONE_NUMBER_ID}/messages`;
      const headers = { Authorization: `Bearer ${WABA_TOKEN}` };

      try {
        const resp = await axios.post(url, payload, { headers });
        const wamid = resp.data.messages?.[0]?.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        await Message.create({
          organizationId: campaign.organizationId,
          campaignId,
          contactId,
          sentBy: campaign.createdBy,
          to: phoneNumber,
          type: template ? 'template' : 'text',
          template: {
            name: template?.name || 'campaign_template',
            language: template?.language || 'en_US',
            components: payload.template?.components || []
          },
          status: 'sent',
          wamid,
          metaResponse: resp.data
        });

        // update campaign stats
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.sent': 1 } }, { new: true, upsert: true });
        return done(null, resp.data);
      } catch (err) {
        console.error('WhatsApp send error:', err.response ? err.response.data : err.message);
        logger.error('webhook', `Meta API delivery failure to ${phoneNumber}`, err, {
          campaignId,
          contactId,
          phoneNumber,
          organizationId: campaign.organizationId,
          metaResponse: err.response ? err.response.data : null
        });
        
        await Message.create({
          organizationId: campaign.organizationId,
          campaignId,
          contactId,
          sentBy: campaign.createdBy,
          to: phoneNumber,
          type: template ? 'template' : 'text',
          template: {
            name: template?.name || 'campaign_template',
            language: template?.language || 'en_US',
            components: payload.template?.components || []
          },
          status: 'failed',
          errorDetails: err.response?.data?.error?.message || err.message,
          metaResponse: err.response ? err.response.data : null
        });

        await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.failed': 1 } }, { new: true, upsert: true });
        return done(new Error('WhatsApp send failed'));
      }
    }

    // If no WABA configured, just simulate success
    const wamid = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await Message.create({
      organizationId: campaign.organizationId,
      campaignId,
      contactId,
      sentBy: campaign.createdBy,
      to: phoneNumber,
      type: template ? 'template' : 'text',
      template: {
        name: template?.name || 'campaign_template',
        language: template?.language || 'en_US',
        components: payload.template?.components || []
      },
      status: 'sent',
      wamid,
      metaResponse: { simulated: true, payload }
    });

    await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.sent': 1 } }, { new: true, upsert: true });
    return done(null, { simulated: true });
  } catch (err) {
    console.error('Worker processing error:', err);
    logger.error('campaigns', `Worker job processing failed`, err, {
      jobId: job?.id,
      campaignId: job?.data?.campaignId,
      organizationId: job?.data?.organizationId || null
    });
    // increment failed counter
    if (job && job.data && job.data.campaignId) {
      try {
        await Message.create({
          organizationId: job.data.organizationId || null,
          campaignId: job.data.campaignId,
          contactId: job.data.contactId,
          to: phoneNumber,
          type: 'template',
          template: {
            name: 'campaign_template',
            language: 'en_US',
            components: []
          },
          status: 'failed',
          errorDetails: err.message
        });
        await Campaign.findByIdAndUpdate(job.data.campaignId, { $inc: { 'stats.failed': 1 } }, { new: true, upsert: true });
      } catch (e) {
        console.error('Failed updating campaign stats after worker error:', e);
      }
    }
    return done(err);
  }
});

queue.on('error', (err) => {
  console.error('Campaign queue error:', err);
  logger.error('queue', `Campaign worker queue encountered error`, err);
});
queue.on('failed', async (job, err) => {
  console.warn(`Job ${job.id} failed:`, err.message || err);
  logger.error('queue', `Campaign worker queue job ${job.id} failed`, err, {
    jobId: job.id,
    campaignId: job.data?.campaignId,
    organizationId: job.data?.organizationId
  });
});
queue.on('completed', async (job, result) => {
  // optionally log
});

console.log('Campaign worker started, listening to queue: campaign:messages');
