const mongoose = require('mongoose');
const Message = require('../models/Message');
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Contact = require('../models/Contact');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

// Helper: ensure auth
function requireUser(req, res) {
  const user = req.user;
  if (!user) {
    sendResponse(res, false, {}, 'Authentication required', 401);
    return null;
  }
  return user;
}

// Permission boundary filter helper
const getQueryFilter = (user, baseFilter = {}) => {
  const filter = { ...baseFilter };
  if (user.role === 'super_admin') {
    // Platform-level access, no tenant restriction
  } else {
    filter.organizationId = new mongoose.Types.ObjectId(user.organizationId);
    if (user.role === 'agent') {
      // Agents can only see messages sent by themselves
      filter.sentBy = new mongoose.Types.ObjectId(user.id);
    }
  }
  return filter;
};

// GET /analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const orgId = user.role !== 'super_admin' ? user.organizationId : null;
    const baseFilter = orgId ? { organizationId: new mongoose.Types.ObjectId(orgId) } : {};

    // Get metadata counts scoped by tenant
    const contacts = await Contact.countDocuments(baseFilter);
    const campaigns = await Campaign.countDocuments(baseFilter);
    const activeCampaigns = await Campaign.countDocuments({
      ...baseFilter,
      status: { $in: ['running', 'scheduled'] }
    });
    const activeTemplates = await Template.countDocuments({
      ...baseFilter,
      status: 'approved'
    });
    const optIns = await Contact.countDocuments({
      ...baseFilter,
      optInStatus: 'opted_in'
    });
    const optOuts = await Contact.countDocuments({
      ...baseFilter,
      optInStatus: 'opted_out'
    });

    // Scoped message counts with role-awareness
    const messageFilter = getQueryFilter(user);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalToday,
      totalWeek,
      totalMonth,
      sent,
      delivered,
      read,
      failed
    ] = await Promise.all([
      Message.countDocuments({ ...messageFilter, createdAt: { $gte: startOfDay } }),
      Message.countDocuments({ ...messageFilter, createdAt: { $gte: startOfWeek } }),
      Message.countDocuments({ ...messageFilter, createdAt: { $gte: startOfMonth } }),
      Message.countDocuments({ ...messageFilter, status: { $in: ['sent', 'delivered', 'read'] } }),
      Message.countDocuments({ ...messageFilter, status: { $in: ['delivered', 'read'] } }),
      Message.countDocuments({ ...messageFilter, status: 'read' }),
      Message.countDocuments({ ...messageFilter, status: 'failed' })
    ]);

    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
    const openRate = delivered > 0 ? Number(((read / delivered) * 100).toFixed(1)) : 0;

    return sendResponse(res, true, {
      overview: {
        contacts,
        campaigns,
        sent,
        delivered,
        failed,
        openRate,
        replyRate: 0,
        activeTemplates,
        optIns,
        optOuts
      },
      totalToday,
      totalWeek,
      totalMonth,
      deliveryRate,
      openRate,
      activeCampaigns,
      sentToday: totalToday
    }, 'Dashboard stats');
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return sendResponse(res, false, {}, 'Failed to get dashboard stats', 500);
  }
};

// GET /analytics/campaign/:id
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const orgId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;
    const campaignId = req.params.id;

    // verify campaign belongs to org (unless super_admin)
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return sendResponse(res, false, {}, 'Campaign not found', 404);
    if (orgId && String(campaign.organizationId) !== String(orgId)) {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    const match = getQueryFilter(user, { campaignId: new mongoose.Types.ObjectId(campaignId) });

    const counts = await Message.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const map = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
    const sent = map.sent || 0;
    const delivered = map.delivered || 0;
    const read = map.read || 0;
    const failed = map.failed || 0;

    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
    const readRate = sent > 0 ? Number(((read / sent) * 100).toFixed(1)) : 0;

    // hourly breakdown last 24 hours (by createdAt)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourly = await Message.aggregate([
      { $match: { ...match, createdAt: { $gte: since } } },
      { $project: { hour: { $hour: '$createdAt' } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hourMap = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    hourly.forEach((r) => { hourMap[r._id] = r.count; });

    return sendResponse(res, true, { sent, delivered, read, failed, deliveryRate, readRate, hourly: hourMap }, 'Campaign analytics');
  } catch (err) {
    console.error('getCampaignAnalytics error:', err);
    return sendResponse(res, false, {}, 'Failed to get campaign analytics', 500);
  }
};

// GET /analytics/trends/messages
exports.getMessageTrends = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const match = getQueryFilter(user, { createdAt: { $gte: since } });

    const agg = await Message.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered', 'read']] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ensure all 30 days are seeded to prevent UI gaps
    const results = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      results[key] = { sent: 0, delivered: 0, read: 0, failed: 0 };
    }
    agg.forEach((r) => {
      results[r._id] = { sent: r.sent, delivered: r.delivered, read: r.read, failed: r.failed };
    });

    const series = Object.keys(results).map((k) => ({
      date: k,
      sent: results[k].sent,
      delivered: results[k].delivered,
      read: results[k].read,
      failed: results[k].failed,
      count: results[k].sent
    }));

    return sendResponse(res, true, series, 'Message trends');
  } catch (err) {
    console.error('getMessageTrends error:', err);
    return sendResponse(res, false, {}, 'Failed to get message trends', 500);
  }
};

// GET /analytics/top-templates
exports.getTopTemplates = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const match = getQueryFilter(user, { type: 'template' });

    const agg = await Message.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$template.name',
          sent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } }
        }
      },
      {
        $project: {
          name: '$_id',
          sent: 1,
          delivered: 1,
          read: 1,
          readRate: { $cond: [{ $gt: ['$sent', 0] }, { $multiply: [{ $divide: ['$read', '$sent'] }, 100] }, 0] }
        }
      },
      { $sort: { readRate: -1 } },
      { $limit: 10 },
    ]);

    return sendResponse(res, true, { templates: agg }, 'Top templates');
  } catch (err) {
    console.error('getTopTemplates error:', err);
    return sendResponse(res, false, {}, 'Failed to get top templates', 500);
  }
};

// GET /analytics/heatmap
exports.getHeatmap = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const match = getQueryFilter(user);

    const agg = await Message.aggregate([
      { $match: match },
      { $project: { hour: { $hour: '$createdAt' } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const map = {};
    for (let h = 0; h < 24; h++) map[h] = 0;
    agg.forEach((r) => { map[r._id] = r.count; });

    return sendResponse(res, true, { heatmap: map }, 'Heatmap by hour');
  } catch (err) {
    console.error('getHeatmap error:', err);
    return sendResponse(res, false, {}, 'Failed to get heatmap', 500);
  }
};

// GET /analytics/audience-growth
exports.getAudienceGrowth = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const orgId = user.role !== 'super_admin' ? user.organizationId : null;
    const baseFilter = orgId ? { organizationId: new mongoose.Types.ObjectId(orgId) } : {};

    // Group contacts over the last 12 weeks
    const since = new Date();
    since.setDate(since.getDate() - 7 * 12);

    const optInAgg = await Contact.aggregate([
      { $match: { ...baseFilter, optInStatus: 'opted_in', optInTimestamp: { $gte: since } } },
      { $project: { week: { $dateToString: { format: '%Y-%U', date: '$optInTimestamp' } } } },
      { $group: { _id: '$week', count: { $sum: 1 } } },
    ]);

    const optOutAgg = await Contact.aggregate([
      { $match: { ...baseFilter, optInStatus: 'opted_out', optOutTimestamp: { $gte: since } } },
      { $project: { week: { $dateToString: { format: '%Y-%U', date: '$optOutTimestamp' } } } },
      { $group: { _id: '$week', count: { $sum: 1 } } },
    ]);

    const mapIn = {};
    const mapOut = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 7 * (11 - i));
      const weekNum = String(Math.ceil(((d - new Date(d.getFullYear(),0,1))/(1000*60*60*24*7))+1)).padStart(2,'0');
      const k = `${d.getFullYear()}-${weekNum}`;
      mapIn[k] = 0;
      mapOut[k] = 0;
    }

    optInAgg.forEach((r) => { mapIn[r._id] = r.count; });
    optOutAgg.forEach((r) => { mapOut[r._id] = r.count; });

    const series = Object.keys(mapIn).map((k) => ({ week: k, optIns: mapIn[k] || 0, optOuts: mapOut[k] || 0 }));

    return sendResponse(res, true, { series }, 'Audience growth');
  } catch (err) {
    console.error('getAudienceGrowth error:', err);
    return sendResponse(res, false, {}, 'Failed to get audience growth', 500);
  }
};
