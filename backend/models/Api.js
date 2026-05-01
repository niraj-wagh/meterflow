const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'API name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required'],
    trim: true
  },
  version: {
    type: String,
    default: 'v1'
  },
  category: {
    type: String,
    enum: ['weather', 'finance', 'data', 'ai', 'payment', 'social', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    requestsPerDay: { type: Number, default: 10000 }
  },
  pricing: {
    model: { type: String, enum: ['free', 'per_request', 'tiered'], default: 'per_request' },
    freeRequests: { type: Number, default: 1000 },
    pricePerRequest: { type: Number, default: 0.005 }, // per request after free tier
    currency: { type: String, default: 'INR' }
  },
  endpoints: [{
    path: String,
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
    description: String,
    isActive: { type: Boolean, default: true }
  }],
  tags: [String],
  totalRequests: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  avgLatency: { type: Number, default: 0 }
}, { timestamps: true });

apiSchema.index({ owner: 1 });
apiSchema.index({ status: 1 });

module.exports = mongoose.model('Api', apiSchema);
