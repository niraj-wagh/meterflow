const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  totalRequests: { type: Number, default: 0 },
  billableRequests: { type: Number, default: 0 },
  freeRequests: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'waived'],
    default: 'pending'
  },
  invoiceId: String,
  stripePaymentIntentId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  breakdown: [{
    api: { type: mongoose.Schema.Types.ObjectId, ref: 'Api' },
    apiName: String,
    requests: Number,
    freeRequests: Number,
    billableRequests: Number,
    amount: Number
  }],
  paidAt: Date,
  dueDate: Date,
  notes: String
}, { timestamps: true });

billingSchema.index({ user: 1, 'period.start': -1 });
billingSchema.index({ status: 1 });

module.exports = mongoose.model('Billing', billingSchema);
