const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Contact = require('../models/Contact');
const { createQueue } = require('../config/redis');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// Create campaign
exports.createCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const {
      name,
      description,
      templateId,
      contactListIds = [],
      targetGroups = [],
      targetTags = [],
      sendRate,
      varMap,
      scheduleNow,
      scheduleDate,
      scheduleTime,
      settings = {},
    } = req.body;

    if (!name) return sendResponse(res, false, {}, 'Name required', 400);
    if (!templateId) return sendResponse(res, false, {}, 'templateId required', 400);

    // ensure template exists and belongs to same org (unless super_admin)
    const tpl = await Template.findById(templateId);
    if (!tpl) return sendResponse(res, false, {}, 'Template not found', 404);
    if (String(tpl.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Template belongs to another organization', 403);
    }

    // build campaign settings
    const campaignSettings = Object.assign({}, settings);
    if (typeof sendRate !== 'undefined') campaignSettings.sendRate = Number(sendRate);
    if (varMap) campaignSettings.personalizeVariables = varMap;

    // determine scheduledAt and status
    let scheduledAt = null;
    const status = scheduleNow ? 'running' : 'scheduled';
    if (!scheduleNow && scheduleDate && scheduleTime) {
      // try to construct an ISO datetime
      const iso = `${scheduleDate}T${scheduleTime}`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) scheduledAt = d;
    }

    const campaign = new Campaign({
      name,
      description,
      templateId,
      contactListIds: Array.isArray(contactListIds) ? contactListIds.filter(id => mongoose.Types.ObjectId.isValid(id)) : [],
      targetGroups: Array.isArray(targetGroups) ? targetGroups.filter(id => mongoose.Types.ObjectId.isValid(id)) : [],
      targetTags: Array.isArray(targetTags) ? targetTags : [],
      status,
      scheduledAt,
      settings: campaignSettings,
      organizationId: user.organizationId,
      createdBy: user.id,
    });

    await campaign.save();

    // if scheduleNow, enqueue jobs immediately (same behavior as launch)
    if (scheduleNow) {
      const lists = campaign.contactListIds || [];
      const groups = campaign.targetGroups || [];
      const tags = campaign.targetTags || [];

      const contactQuery = { organizationId: campaign.organizationId, optInStatus: 'opted_in' };
      
      const orConditions = [];
      if (lists.length) orConditions.push({ lists: { $in: lists } });
      if (groups.length) orConditions.push({ groupIds: { $in: groups } });
      if (tags.length) orConditions.push({ tags: { $in: tags } });

      if (orConditions.length > 0) {
        contactQuery.$or = orConditions;
      } else if (req.body.selectAll !== true && (!contactListIds || !contactListIds.includes('all'))) {
         // If no targets provided AND "select all" is not true, default to no contacts
         return sendResponse(res, true, { campaign }, 'Campaign created (no audience selected)', 201);
      }

      const contacts = await Contact.find(contactQuery).lean();
      if (!contacts.length) {
        // Campaign created but no contacts to queue
        return sendResponse(res, true, { campaign }, 'Campaign created (no opted-in contacts found)', 201);
      }

      const queue = createQueue('campaign:messages');
      const rate = Number(campaign.settings && campaign.settings.sendRate) || 30;
      const intervalMs = Math.max(1, Math.floor(60000 / Math.max(1, Math.min(60, rate))));

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
    }

    return sendResponse(res, true, { campaign }, 'Campaign created', 201);
  } catch (err) {
    console.error('createCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to create campaign', 500);
  }
};

// Get campaigns (list) - org scoped unless super_admin
exports.getCampaigns = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { page = 1, limit = 25, status, search, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const query = {};
    if (user.role !== 'super_admin') query.organizationId = user.organizationId;
    if (status) query.status = status;
    if (search) query.name = new RegExp(String(search).trim(), 'i');

    const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Campaign.countDocuments(query),
    ]);

    return sendResponse(res, true, { campaigns, meta: { total, page: Number(page), limit: Number(limit) } }, 'Campaigns retrieved');
  } catch (err) {
    console.error('getCampaigns error:', err);
    return sendResponse(res, false, {}, 'Failed to get campaigns', 500);
  }
};

// Get single campaign with org check
exports.getCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);
    return sendResponse(res, true, { campaign }, 'Campaign retrieved');
  } catch (err) {
    console.error('getCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to get campaign', 500);
  }
};

// Update campaign (not allowed if running/completed)
exports.updateCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);
    if (['running', 'completed'].includes(campaign.status)) return sendResponse(res, false, {}, 'Cannot edit running or completed campaigns', 400);

    const updatable = ['name', 'description', 'templateId', 'contactListIds', 'scheduledAt', 'settings'];
    updatable.forEach((k) => {
      if (typeof req.body[k] !== 'undefined') campaign[k] = req.body[k];
    });

    await campaign.save();
    return sendResponse(res, true, { campaign }, 'Campaign updated');
  } catch (err) {
    console.error('updateCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to update campaign', 500);
  }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);
    if (campaign.status === 'running') return sendResponse(res, false, {}, 'Cannot delete running campaign', 400);
    await Campaign.findByIdAndDelete(id);
    return sendResponse(res, true, {}, 'Campaign deleted');
  } catch (err) {
    console.error('deleteCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to delete campaign', 500);
  }
};

// Helper: change campaign status (start/pause/resume/cancel)
exports.changeStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const { action } = req.body; // start, pause, resume, cancel
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    switch (action) {
      case 'start':
        if (campaign.status !== 'scheduled' && campaign.status !== 'draft') return sendResponse(res, false, {}, 'Campaign cannot be started', 400);
        campaign.status = 'running';
        campaign.startedAt = new Date();
        break;
      case 'pause':
        if (campaign.status !== 'running') return sendResponse(res, false, {}, 'Can only pause running campaigns', 400);
        campaign.status = 'paused';
        break;
      case 'resume':
        if (campaign.status !== 'paused') return sendResponse(res, false, {}, 'Can only resume paused campaigns', 400);
        campaign.status = 'running';
        break;
      case 'cancel':
        if (['completed', 'cancelled'].includes(campaign.status)) return sendResponse(res, false, {}, 'Cannot cancel completed or cancelled campaign', 400);
        campaign.status = 'cancelled';
        campaign.completedAt = new Date();
        break;
      default:
        return sendResponse(res, false, {}, 'Invalid action', 400);
    }

    await campaign.save();
    return sendResponse(res, true, { campaign }, 'Campaign status updated');
  } catch (err) {
    console.error('changeStatus error:', err);
    return sendResponse(res, false, {}, 'Failed to change campaign status', 500);
  }
};

// Launch campaign: queue message jobs for all opted-in contacts in campaign's contact lists
exports.launchCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    // Only draft or scheduled campaigns can be launched
    if (!['draft', 'scheduled'].includes(campaign.status)) return sendResponse(res, false, {}, 'Campaign cannot be launched in its current state', 400);

    // fetch contacts from lists/groups/tags
    const lists = campaign.contactListIds || [];
    const groups = campaign.targetGroups || [];
    const tags = campaign.targetTags || [];

    const contactQuery = { organizationId: campaign.organizationId, optInStatus: 'opted_in' };
    const orConditions = [];
    if (lists.length) orConditions.push({ lists: { $in: lists } });
    if (groups.length) orConditions.push({ groupIds: { $in: groups } });
    if (tags.length) orConditions.push({ tags: { $in: tags } });

    if (orConditions.length > 0) {
      contactQuery.$or = orConditions;
    }

    const contacts = await Contact.find(contactQuery).lean();
    if (!contacts.length) return sendResponse(res, false, {}, 'No opted-in contacts found for campaign', 400);

    // prepare shared queue for campaign messages
    const queueName = `campaign:messages`;
    const queue = createQueue(queueName);

    // compute interval between messages in ms
    const sendRate = (campaign.settings && campaign.settings.sendRate) ? Number(campaign.settings.sendRate) : 30;
    const intervalMs = Math.max(1, Math.floor(60000 / Math.max(1, Math.min(60, sendRate))));

    // create jobs with incremental delay to respect sendRate
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

    // update campaign status and stats
    campaign.status = 'running';
    campaign.startedAt = new Date();
    campaign.stats = campaign.stats || {};
    campaign.stats.totalContacts = contacts.length;
    await campaign.save();

    return sendResponse(res, true, { queued: contacts.length }, 'Campaign launched');
  } catch (err) {
    console.error('launchCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to launch campaign', 500);
  }
};

// Pause campaign: pause Bull queue processing (affects shared queue)
exports.pauseCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    const queue = createQueue('campaign:messages');
    await queue.pause();
    campaign.status = 'paused';
    await campaign.save();
    return sendResponse(res, true, {}, 'Campaign paused');
  } catch (err) {
    console.error('pauseCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to pause campaign', 500);
  }
};

// Resume campaign: resume Bull queue processing
exports.resumeCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    const queue = createQueue('campaign:messages');
    await queue.resume();
    campaign.status = 'running';
    await campaign.save();
    return sendResponse(res, true, {}, 'Campaign resumed');
  } catch (err) {
    console.error('resumeCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to resume campaign', 500);
  }
};

// Cancel campaign: remove remaining jobs from queue
exports.cancelCampaign = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    const queue = createQueue('campaign:messages');

    // remove waiting and delayed jobs only for this campaign
    const waiting = await queue.getWaiting();
    const delayed = await queue.getDelayed();
    const toRemove = [...waiting, ...delayed].filter((j) => j && j.data && String(j.data.campaignId) === String(campaign._id));
    await Promise.all(toRemove.map((j) => j.remove()));

    campaign.status = 'cancelled';
    campaign.completedAt = new Date();
    await campaign.save();

    return sendResponse(res, true, { removed: toRemove.length }, 'Campaign cancelled and remaining jobs removed');
  } catch (err) {
    console.error('cancelCampaign error:', err);
    return sendResponse(res, false, {}, 'Failed to cancel campaign', 500);
  }
};

// getCampaignById with real-time stats from Bull
exports.getCampaignById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (String(campaign.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') return sendResponse(res, false, {}, 'Forbidden', 403);

    const queue = createQueue('campaign:messages');

    // compute per-campaign job counts by scanning lists (limited by queue API)
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    const filterByCampaign = (jobs) => (jobs || []).filter((j) => j && j.data && String(j.data.campaignId) === String(campaign._id));

    const stats = Object.assign({}, campaign.stats || {});
    stats.waiting = filterByCampaign(waiting).length;
    stats.active = filterByCampaign(active).length;
    stats.completed = filterByCampaign(completed).length;
    stats.failed = filterByCampaign(failed).length;
    stats.delayed = filterByCampaign(delayed).length;

    return sendResponse(res, true, { campaign, stats }, 'Campaign retrieved with live stats');
  } catch (err) {
    console.error('getCampaignById error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve campaign', 500);
  }
};
