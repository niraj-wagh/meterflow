const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  resource: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
