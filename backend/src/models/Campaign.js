const mongoose = require('mongoose');

const { Schema } = mongoose;

const StatusEnum = ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled'];

const SettingsSchema = new Schema(
  {
    sendRate: { type: Number, default: 30, min: 1, max: 60 },
    personalizeVariables: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

const StatsSchema = new Schema(
  {
    totalContacts: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    optedOut: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    contactListIds: [{ type: Schema.Types.ObjectId, ref: 'ContactList' }],
    targetGroups: [{ type: Schema.Types.ObjectId, ref: 'ContactGroup' }],
    targetTags: [{ type: String }],
    status: { type: String, enum: StatusEnum, default: 'draft' },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    settings: { type: SettingsSchema, default: () => ({}) },
    stats: { type: StatsSchema, default: () => ({}) },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Ensure sendRate never exceeds 60 (additional safeguard)
// Ensure sendRate never exceeds 60 (additional safeguard)
CampaignSchema.pre('validate', function () {

  if (this.settings && typeof this.settings.sendRate === 'number') {

    if (this.settings.sendRate > 60) {
      this.invalidate(
        'settings.sendRate',
        'sendRate cannot exceed 60 messages per minute'
      );
    }

    if (this.settings.sendRate < 1) {
      this.invalidate(
        'settings.sendRate',
        'sendRate must be at least 1'
      );
    }

  }

});

// Indexes
CampaignSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Campaign', CampaignSchema);
