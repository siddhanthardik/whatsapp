const mongoose = require('mongoose');

const { Schema } = mongoose;

const CategoryEnum = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
const HeaderTypes = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'NONE'];
const ButtonTypes = ['QUICK_REPLY', 'CALL_TO_ACTION', 'URL', 'PHONE_NUMBER', 'PHONE'];
const ApprovalStatus = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

const HeaderSchema = new Schema(
  {
    type: { type: String, enum: HeaderTypes },
    text: { type: String }, // for TEXT type
    mediaUrl: { type: String }, // for IMAGE, VIDEO, DOCUMENT (URL or base64)
    mediaType: { type: String }, // MIME type: image/jpeg, image/png, video/mp4, application/pdf, etc
  },
  { _id: false }
);

const BodySchema = new Schema(
  {
    text: { type: String, required: true },
    variables: { type: [String], default: [] }, // sample values like ["John", "50%"]
  },
  { _id: false }
);

const FooterSchema = new Schema(
  {
    text: { type: String },
  },
  { _id: false }
);

const ButtonSchema = new Schema(
  {
    type: { type: String, enum: ButtonTypes, required: true }, // QUICK_REPLY, URL, PHONE_NUMBER
    text: { type: String, required: true },
    url: { type: String }, // for URL type (can contain {{1}} variables)
    phoneNumber: { type: String }, // for PHONE_NUMBER type
  },
  { _id: false }
);

const TemplateSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true }, // Display name
    templateId: { type: String, lowercase: true, trim: true, index: true, sparse: true }, // WhatsApp template name (lowercase, underscores, auto-generated from name)
    category: { type: String, enum: CategoryEnum, default: 'UTILITY' },
    language: { type: String, default: 'en_US' },
    header: HeaderSchema, // optional
    body: BodySchema, // required - contains text and sample variable values
    footer: FooterSchema, // optional
    buttons: { type: [ButtonSchema], default: [] }, // optional, max 10
    
    // Meta/WhatsApp info
    whatsappTemplateId: { type: String, default: null }, // returned by Meta after successful submission
    approvalStatus: { type: String, enum: ApprovalStatus, default: 'DRAFT' }, // DRAFT, PENDING, APPROVED, REJECTED
    rejectionReason: { type: String, default: null }, // reason from WhatsApp if rejected
    
    // Tracking
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique name per organization
TemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Template', TemplateSchema);
