const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// GET /api/subscription
router.get('/', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization required' });

    let sub = await Subscription.findOne({ organizationId: orgId });
    if (!sub) {
      // Create a default free plan subscription
      sub = new Subscription({ organizationId: orgId, plan: 'free' });
      await sub.save();
    }
    return res.json({ success: true, data: { subscription: sub } });
  } catch (err) {
    console.error('Failed to get subscription:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve subscription' });
  }
});

// POST /api/subscription/upgrade
router.post('/upgrade', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization required' });

    const { plan, billingCycle } = req.body;
    if (!['starter', 'growth', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    // Set plan limits
    let maxContacts = 500;
    let maxCampaignsPerMonth = 2;
    let maxUsers = 1;
    let maxTemplates = 5;
    let maxMessagesPerMonth = 1000;

    if (plan === 'starter') {
      maxContacts = 2500;
      maxCampaignsPerMonth = 10;
      maxUsers = 3;
      maxTemplates = 15;
      maxMessagesPerMonth = 10000;
    } else if (plan === 'growth') {
      maxContacts = 10000;
      maxCampaignsPerMonth = 50;
      maxUsers = 10;
      maxTemplates = 50;
      maxMessagesPerMonth = 50000;
    } else if (plan === 'enterprise') {
      maxContacts = 100000;
      maxCampaignsPerMonth = 99999;
      maxUsers = 999;
      maxTemplates = 999;
      maxMessagesPerMonth = 1000000;
    }

    const updated = await Subscription.findOneAndUpdate(
      { organizationId: orgId },
      {
        $set: {
          plan,
          billingCycle: billingCycle || 'monthly',
          status: 'active',
          maxContacts,
          maxCampaignsPerMonth,
          maxUsers,
          maxTemplates,
          maxMessagesPerMonth,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: { subscription: updated }, message: `Successfully upgraded to ${plan}!` });
  } catch (err) {
    console.error('Failed to upgrade subscription:', err);
    return res.status(500).json({ success: false, message: 'Failed to upgrade subscription' });
  }
});

module.exports = router;
