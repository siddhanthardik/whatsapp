const cron = require('node-cron');
const Subscription = require('../models/Subscription');

// Run on the 1st day of every month at midnight
const startMonthlyResetJob = () => {
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Running monthly subscription reset job...');
    try {
      const result = await Subscription.updateMany(
        { status: 'active', billingCycle: 'monthly' },
        {
          $set: {
            currentCampaignsThisMonth: 0,
            currentMessagesThisMonth: 0
          }
        }
      );
      console.log(`[CRON] Reset monthly usage for ${result.modifiedCount} active subscriptions.`);
    } catch (err) {
      console.error('[CRON] Failed to reset monthly subscriptions:', err);
    }
  });
};

module.exports = startMonthlyResetJob;
