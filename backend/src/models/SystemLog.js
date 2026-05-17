const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true,
    required: false
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    required: true,
    index: true
  },
  service: {
    type: String,
    enum: ['api', 'worker', 'campaigns', 'webhook', 'auth', 'billing', 'analytics', 'queue'],
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  resolutionNotes: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for performant log filtering
systemLogSchema.index({ service: 1, level: 1, createdAt: -1 });
systemLogSchema.index({ resolved: 1, level: 1, createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
