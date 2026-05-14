const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, default: null },
    timezone: { type: String, default: null },
    language: { type: String, default: null },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, lowercase: true, trim: true, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    phoneId: { type: String, default: null },
    webhookUrl: { type: String, default: null },
    smtpHost: { type: String, default: null },
    smtpPort: { type: String, default: null },
    smtpUser: { type: String, default: null },
    smtpFrom: { type: String, default: null },
    smtpPass: { type: String, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', OrganizationSchema);
