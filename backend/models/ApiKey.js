const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const apiKeySchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true
  },
  key: {
    type: String,
    unique: true,
    default: () => `mf_${uuidv4().replace(/-/g, '')}`
  },
  hashedKey: String,
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  permissions: {
    type: [String],
    default: ['read']
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    requestsPerDay: { type: Number, default: 10000 }
  },
  allowedIPs: [String],
  allowedDomains: [String],
  expiresAt: Date,
  lastUsed: Date,
  totalRequests: { type: Number, default: 0 },
  totalErrors: { type: Number, default: 0 },
  metadata: {
    type: Map,
    of: String
  }
}, { timestamps: true });

apiKeySchema.index({ key: 1 });
apiKeySchema.index({ owner: 1 });
apiKeySchema.index({ api: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
