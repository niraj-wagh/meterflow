const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  apiKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true
  },
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  latency: {
    type: Number, // milliseconds
    required: true
  },
  requestSize: Number, // bytes
  responseSize: Number, // bytes
  ipAddress: String,
  userAgent: String,
  isError: {
    type: Boolean,
    default: false
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  cost: {
    type: Number,
    default: 0
  }
});

// Compound indexes for efficient querying
usageLogSchema.index({ user: 1, timestamp: -1 });
usageLogSchema.index({ api: 1, timestamp: -1 });
usageLogSchema.index({ apiKey: 1, timestamp: -1 });
usageLogSchema.index({ timestamp: -1 });

// TTL: auto-delete logs older than 90 days
usageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
