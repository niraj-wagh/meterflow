const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: {
    type: [String],
    enum: ['usage.limit_reached', 'usage.threshold', 'billing.invoice_created', 'billing.payment_failed', 'api.key_revoked', 'api.rate_limit_exceeded'],
    default: ['usage.limit_reached']
  },
  secret: String,
  isActive: { type: Boolean, default: true },
  lastTriggered: Date,
  failureCount: { type: Number, default: 0 },
  deliveries: [{
    event: String,
    status: { type: String, enum: ['success', 'failed'] },
    responseCode: Number,
    timestamp: Date,
    payload: Object
  }]
}, { timestamps: true });

module.exports = mongoose.model('Webhook', webhookSchema);
