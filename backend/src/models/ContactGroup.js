const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#10B981' },
    // Primary tenant key — organizationId is the established field across this codebase.
    // We keep it as-is for backward compatibility. "companyId" maps to this same concept.
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound unique: group names are unique ONLY within the same organization/company.
// This replaces any global uniqueness on name.
ContactGroupSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ContactGroup', ContactGroupSchema);
