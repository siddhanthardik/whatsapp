const cron = require('node-cron');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const Template = require('../models/Template');
const { createQueue } = require('../config/redis');

// Background campaign runner executing every minute
function startCampaignScheduler() {
  console.log('[Scheduler] Initializing Campaign Scheduler Engine (Interval: 1m)');
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find all scheduled campaigns where scheduledAt <= now and status is 'scheduled'
      const scheduledCampaigns = await Campaign.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      });

      for (const campaign of scheduledCampaigns) {
        console.log(`[Scheduler] Executing scheduled campaign: ${campaign.name} (${campaign._id})`);
        
        // Execute the campaign!
        await executeCampaign(campaign);
      }
    } catch (err) {
      console.error('[Scheduler] Error running scheduled campaign checks:', err);
    }
  });
}

async function executeCampaign(campaign) {
  try {
    // 1. Fetch template
    const tpl = await Template.findById(campaign.templateId);
    if (!tpl) {
      campaign.status = 'failed';
      await campaign.save();
      console.warn(`[Scheduler] Campaign ${campaign._id} failed: Template not found`);
      return;
    }

    // 2. Build target contact query
    const lists = campaign.contactListIds || [];
    const groups = campaign.targetGroups || [];
    const tags = campaign.targetTags || [];
    const exclGroups = campaign.exclusionGroups || [];
    const exclTags = campaign.exclusionTags || [];

    const contactQuery = {
      organizationId: campaign.organizationId,
      optInStatus: 'opted_in',
      isBlocked: { $ne: true }
    };

    const orConditions = [];
    if (lists.length) orConditions.push({ lists: { $in: lists } });
    if (groups.length) orConditions.push({ groupIds: { $in: groups } });
    if (tags.length) orConditions.push({ tags: { $in: tags } });

    if (orConditions.length > 0) {
      contactQuery.$or = orConditions;
    } else {
      // Match nothing since no targets were selected
      campaign.status = 'failed';
      await campaign.save();
      console.warn(`[Scheduler] Campaign ${campaign._id} failed: No target groups or tags`);
      return;
    }

    // Exclusions
    const andConditions = [];
    if (exclGroups.length) andConditions.push({ groupIds: { $nin: exclGroups } });
    if (exclTags.length) andConditions.push({ tags: { $nin: exclTags } });

    if (andConditions.length > 0) {
      contactQuery.$and = andConditions;
    }

    const contacts = await Contact.find(contactQuery).lean();
    if (!contacts.length) {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
      campaign.stats = { totalContacts: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
      await campaign.save();
      console.log(`[Scheduler] Campaign ${campaign._id} finished: Audience size is 0`);
      return;
    }

    // 3. Queue Bull jobs
    const queue = createQueue('campaign:messages');
    const sendRate = (campaign.settings && campaign.settings.sendRate) ? Number(campaign.settings.sendRate) : 30;
    const intervalMs = Math.max(1, Math.floor(60000 / Math.max(1, Math.min(60, sendRate))));

    const jobs = [];
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const delay = i * intervalMs;
      const jobData = {
        campaignId: campaign._id.toString(),
        contactId: c._id.toString(),
        phoneNumber: c.phoneNumber,
        templateId: campaign.templateId,
        personalizeVariables: campaign.settings ? (campaign.settings.personalizeVariables || {}) : {},
      };
      jobs.push(queue.add(jobData, { delay, removeOnComplete: true, attempts: 3 }));
    }

    await Promise.all(jobs);

    campaign.status = 'running';
    campaign.startedAt = new Date();
    campaign.stats = campaign.stats || {};
    campaign.stats.totalContacts = contacts.length;
    await campaign.save();

    console.log(`[Scheduler] Successfully queued ${contacts.length} jobs for scheduled campaign: ${campaign.name}`);
  } catch (err) {
    console.error(`[Scheduler] Failed to execute campaign ${campaign._id}:`, err);
    campaign.status = 'failed';
    await campaign.save();
  }
}

module.exports = startCampaignScheduler;
