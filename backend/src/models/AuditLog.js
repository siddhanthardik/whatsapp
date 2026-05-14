const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
