const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },

    // Quotas (Limits)
    maxContacts: { type: Number, default: 500 },
    maxCampaignsPerMonth: { type: Number, default: 2 },
    maxUsers: { type: Number, default: 1 },
    maxTemplates: { type: Number, default: 5 },
    maxMessagesPerMonth: { type: Number, default: 1000 },

    // Current Usage
    currentContacts: { type: Number, default: 0 },
    currentCampaignsThisMonth: { type: Number, default: 0 },
    currentUsers: { type: Number, default: 1 },
    currentMessagesThisMonth: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
