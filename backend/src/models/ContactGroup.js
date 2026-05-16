const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#10B981' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ContactGroupSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ContactGroup', ContactGroupSchema);
