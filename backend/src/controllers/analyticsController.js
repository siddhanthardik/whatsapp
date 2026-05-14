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

// GET /analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const orgId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;

    // messages counts for today/week/month and overall rates
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // We need to join Message -> Campaign to scope by organizationId
    const baseMatch = { $expr: { $eq: ['$campaignId', '$$campaignId'] } };

    // Use aggregation with $lookup to join campaigns then facet counts
    const pipeline = [
      { $lookup: {
          from: 'campaigns',
          localField: 'campaignId',
          foreignField: '_id',
          as: 'campaign',
        }
      },
      { $unwind: '$campaign' },
      // if orgId present, scope by organization; otherwise return global metrics (super_admin)
      ...(orgId ? [{ $match: { 'campaign.organizationId': orgId } }] : []),
      { $facet: {
          totalToday: [{ $match: { createdAt: { $gte: startOfDay } } }, { $count: 'count' }],
          totalWeek: [{ $match: { createdAt: { $gte: startOfWeek } } }, { $count: 'count' }],
          totalMonth: [{ $match: { createdAt: { $gte: startOfMonth } } }, { $count: 'count' }],
          sentCount: [{ $match: { status: 'sent' } }, { $count: 'count' }],
          deliveredCount: [{ $match: { status: 'delivered' } }, { $count: 'count' }],
          readCount: [{ $match: { status: 'read' } }, { $count: 'count' }],
        }
      },
    ];

    const agg = await Message.aggregate(pipeline);
    const res0 = agg[0] || {};

    const totalToday = (res0.totalToday[0] && res0.totalToday[0].count) || 0;
    const totalWeek = (res0.totalWeek[0] && res0.totalWeek[0].count) || 0;
    const totalMonth = (res0.totalMonth[0] && res0.totalMonth[0].count) || 0;
    const sent = (res0.sentCount[0] && res0.sentCount[0].count) || 0;
    const delivered = (res0.deliveredCount[0] && res0.deliveredCount[0].count) || 0;
    const read = (res0.readCount[0] && res0.readCount[0].count) || 0;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const readRate = sent > 0 ? (read / sent) * 100 : 0;

    const activeCampaigns = await Campaign.countDocuments(orgId ? { organizationId: orgId, status: { $in: ['running', 'scheduled'] } } : { status: { $in: ['running', 'scheduled'] } });

    return sendResponse(res, true, { totalToday, totalWeek, totalMonth, deliveryRate, readRate, activeCampaigns }, 'Dashboard stats');
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
    const orgId = user.organizationId ? mongoose.Types.ObjectId(user.organizationId) : null;
    const campaignId = req.params.id;

    // verify campaign belongs to org
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || String(campaign.organizationId) !== String(orgId)) return sendResponse(res, false, {}, 'Campaign not found or forbidden', 404);

    const match = { campaignId: new mongoose.Types.ObjectId(campaignId) };

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

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const readRate = sent > 0 ? (read / sent) * 100 : 0;

    // hourly breakdown last 24 hours (by sentAt)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourly = await Message.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId), sentAt: { $gte: since } } },
      { $project: { hour: { $hour: '$sentAt' } } },
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
    const orgId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const agg = await Message.aggregate([
      {
        $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' },
      },
      { $unwind: '$campaign' },
      ...(orgId ? [{ $match: { 'campaign.organizationId': orgId, createdAt: { $gte: since } } }] : [{ $match: { createdAt: { $gte: since } } }]),
      { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // ensure all last 30 days included
    const results = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      results[key] = 0;
    }
    agg.forEach((r) => { results[r._id] = r.count; });

    const series = Object.keys(results).map((k) => ({ date: k, count: results[k] }));
    return sendResponse(res, true, { series }, 'Message trends');
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
    const orgId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;

    // Join messages -> campaigns -> templates, compute read rate per template
    const agg = await Message.aggregate([
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: '$campaign' },
      ...(orgId ? [{ $match: { 'campaign.organizationId': orgId } }] : []),
      { $lookup: { from: 'templates', localField: 'campaign.templateId', foreignField: '_id', as: 'template' } },
      { $unwind: { path: '$template', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$template._id', name: { $first: '$template.name' }, sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } }, read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } } } },
      { $project: { name: 1, sent: 1, read: 1, readRate: { $cond: [{ $gt: ['$sent', 0] }, { $multiply: [{ $divide: ['$read', '$sent'] }, 100] }, 0] } } },
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
    const orgId = user.organizationId ? mongoose.Types.ObjectId(user.organizationId) : null;

    const agg = await Message.aggregate([
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: '$campaign' },
      { $match: { 'campaign.organizationId': orgId, sentAt: { $exists: true } } },
      { $project: { hour: { $hour: '$sentAt' } } },
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
    const orgId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;

    // last 12 weeks: group by ISO week-year
    const since = new Date();
    since.setDate(since.getDate() - 7 * 12);

    const optInAgg = await Contact.aggregate([
      { $match: { organizationId: orgId, optInTimestamp: { $gte: since } } },
      { $project: { week: { $dateToString: { format: '%Y-%U', date: '$optInTimestamp' } } } },
      { $group: { _id: '$week', count: { $sum: 1 } } },
    ]);

    const optOutAgg = await Contact.aggregate([
      { $match: { organizationId: orgId, optOutTimestamp: { $gte: since } } },
      { $project: { week: { $dateToString: { format: '%Y-%U', date: '$optOutTimestamp' } } } },
      { $group: { _id: '$week', count: { $sum: 1 } } },
    ]);

    const mapIn = {};
    const mapOut = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 7 * (11 - i));
      const k = `${d.getFullYear()}-${String(Math.ceil(((d - new Date(d.getFullYear(),0,1))/(1000*60*60*24*7))+1)).padStart(2,'0')}`; // fallback key
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
