const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes' }
});

// Gateway rate limiter - checks per API key limits
const gatewayRateLimiter = async (req, res, next) => {
  // This middleware runs after API key validation
  // req.apiKey is set by validateApiKey middleware
  if (!req.apiKey) return next();

  const key = req.apiKey;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  // In production, use Redis for distributed rate limiting
  // For now using in-memory with a simple Map
  if (!global.rateLimitStore) global.rateLimitStore = new Map();

  const storeKey = `ratelimit:${key._id}`;
  const record = global.rateLimitStore.get(storeKey) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  global.rateLimitStore.set(storeKey, record);

  const limit = key.rateLimit?.requestsPerMinute || 60;

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
  res.setHeader('X-RateLimit-Reset', record.resetTime);

  if (record.count > limit) {
    // Emit real-time event
    if (global.io) {
      global.io.to(`user-${key.owner}`).emit('rate-limit-exceeded', {
        apiKeyId: key._id,
        apiKeyName: key.name,
        timestamp: new Date()
      });
    }
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  next();
};

module.exports = { generalLimiter, authLimiter, gatewayRateLimiter };
