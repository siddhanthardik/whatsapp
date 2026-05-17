const mongoose = require('mongoose');

const { Schema } = mongoose;

const optInStatusEnum = ['opted_in', 'opted_out', 'pending'];
const optInSourceEnum = ['web_form', 'csv_import', 'keyword', 'api', 'manual'];

const ContactSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Phone number must be in E.164 format with country code'],
    },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    customFields: { type: Map, of: String, default: {} },
    tags: [{ type: String, trim: true, lowercase: true }],
    // Contacts belong to one or more Contact Groups, scoped to the same organization
    groupIds: [{ type: Schema.Types.ObjectId, ref: 'ContactGroup' }],
    // Primary tenant key — organizationId is the tenant isolation field
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    lists: [{ type: Schema.Types.ObjectId, ref: 'ContactList' }],
    optInStatus: { type: String, enum: optInStatusEnum, default: 'pending' },
    optInSource: { type: String, enum: optInSourceEnum, default: 'manual' },
    optInTimestamp: { type: Date, default: null },
    optOutTimestamp: { type: Date, default: null },
    optOutReason: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
ContactSchema.index({ phoneNumber: 1 });
// Compound unique per organization: same phone cannot appear twice in the same org
ContactSchema.index({ organizationId: 1, phoneNumber: 1 }, { unique: true, sparse: true });
// Index for efficient group-based queries
ContactSchema.index({ groupIds: 1 });
// Index for efficient tag-based queries
ContactSchema.index({ tags: 1 });

module.exports = mongoose.model('Contact', ContactSchema);
