const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  sentBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to:             { type: String, required: true },
  type:           { type: String, enum: ['text', 'template', 'image', 'video', 'audio', 'document'], required: true },
  text:           { body: String },
  template:       { name: String, language: String, components: Array },
  status:         { type: String, enum: ['pending', 'accepted', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  wamid:          { type: String },
  errorDetails:   { type: String },
}, { timestamps: true });

messageSchema.index({ organizationId: 1, createdAt: -1 });
messageSchema.index({ wamid: 1 });

module.exports = mongoose.model('Message', messageSchema);