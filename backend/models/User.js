const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'api_owner', 'consumer'],
    default: 'api_owner'
  },
  company: {
    type: String,
    trim: true
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  planLimits: {
    requestsPerMonth: { type: Number, default: 1000 },
    apisAllowed: { type: Number, default: 3 },
    keysPerApi: { type: Number, default: 5 }
  },
  stripeCustomerId: String,
  razorpayCustomerId: String,
  refreshToken: String,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Set plan limits based on plan
userSchema.methods.setPlanLimits = function () {
  const limits = {
    free: { requestsPerMonth: 1000, apisAllowed: 3, keysPerApi: 5 },
    pro: { requestsPerMonth: 100000, apisAllowed: 20, keysPerApi: 50 },
    enterprise: { requestsPerMonth: 10000000, apisAllowed: 999, keysPerApi: 999 }
  };
  this.planLimits = limits[this.plan];
};

module.exports = mongoose.model('User', userSchema);
