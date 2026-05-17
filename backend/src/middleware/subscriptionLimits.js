const Subscription = require('../models/Subscription');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message, code: !success ? 'PLAN_LIMIT_REACHED' : undefined });
}

/**
 * Middleware factory to check usage limits based on subscription tier.
 * Requires req.user to be set via auth middleware.
 * @param {string} resourceType - one of 'contacts', 'campaigns', 'users', 'messages', 'templates'
 * @param {number} incrementAmount - optional, amount to check against limit (e.g. bulk importing 100 contacts)
 */
const checkLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
      if (user.role === 'super_admin') return next();

      const orgId = user.organizationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'Organization required' });

      // Find or create default free subscription if missing
      let sub = await Subscription.findOne({ organizationId: orgId });
      if (!sub) {
        sub = new Subscription({ organizationId: orgId, plan: 'free' });
        await sub.save();
      }

      if (sub.status !== 'active') {
        return sendResponse(res, false, {}, 'Your subscription is inactive. Please renew to continue.', 402);
      }

      // Check specific resource limits
      let isExceeded = false;
      let limitMsg = '';

      switch (resourceType) {
        case 'contacts':
          // Check if adding one more contact exceeds
          const incContacts = req.body && Array.isArray(req.body.contacts) ? req.body.contacts.length : 1;
          if (sub.currentContacts + incContacts > sub.maxContacts) {
            isExceeded = true;
            limitMsg = `Contact limit reached (${sub.maxContacts}). Upgrade your plan.`;
          }
          break;
        case 'campaigns':
          if (sub.currentCampaignsThisMonth + 1 > sub.maxCampaignsPerMonth) {
            isExceeded = true;
            limitMsg = `Campaign limit reached (${sub.maxCampaignsPerMonth} per month). Upgrade your plan.`;
          }
          break;
        case 'users':
          if (sub.currentUsers + 1 > sub.maxUsers) {
            isExceeded = true;
            limitMsg = `User limit reached (${sub.maxUsers}). Upgrade your plan.`;
          }
          break;
        case 'messages':
          // Note: messages count can vary per campaign, this might just check baseline capacity
          const estMessages = req.body && req.body.estimatedMessages ? req.body.estimatedMessages : 1;
          if (sub.currentMessagesThisMonth + estMessages > sub.maxMessagesPerMonth) {
             isExceeded = true;
             limitMsg = `Message limit reached (${sub.maxMessagesPerMonth} per month). Upgrade your plan.`;
          }
          break;
        case 'templates':
          // If we had a currentTemplates tracker
          // Just enforcing maxTemplates limit dynamically requires querying Template count, or we can add currentTemplates
          const templatesCount = await require('mongoose').model('Template').countDocuments({ organizationId: orgId });
          if (templatesCount >= sub.maxTemplates) {
            isExceeded = true;
            limitMsg = `Template limit reached (${sub.maxTemplates}). Upgrade your plan.`;
          }
          break;
        default:
          break;
      }

      if (isExceeded) {
        return res.status(402).json({
          success: false,
          code: 'PLAN_LIMIT_REACHED',
          message: limitMsg
        });
      }

      // Inject subscription object so controllers can update usage easily if needed
      req.subscription = sub;
      next();
    } catch (err) {
      console.error('checkLimit middleware error:', err);
      return res.status(500).json({ success: false, message: 'Failed to verify subscription limits' });
    }
  };
};

module.exports = { checkLimit };
