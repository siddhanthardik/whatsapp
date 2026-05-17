const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  campaignId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  contactId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  sentBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to:             { type: String, required: true },
  type:           { type: String, enum: ['text', 'template', 'image', 'video', 'audio', 'document'], required: true },
  text:           { body: String },
  template:       { name: String, language: String, components: Array },
  status:         { type: String, enum: ['queued', 'processing', 'pending', 'accepted', 'sent', 'delivered', 'read', 'failed'], default: 'queued' },
  wamid:          { type: String },
  errorDetails:   { type: String },
  retries:        { type: Number, default: 0 },
  metaResponse:   { type: mongoose.Schema.Types.Mixed }, // Store full Meta response
  webhookPayloads:{ type: [mongoose.Schema.Types.Mixed], default: [] }, // Store incoming webhook payloads
}, { timestamps: true });

messageSchema.index({ organizationId: 1, createdAt: -1 });
messageSchema.index({ wamid: 1 });
messageSchema.index({ campaignId: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);