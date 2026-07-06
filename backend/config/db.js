const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS:          60000,
  connectTimeoutMS:         30000,
  maxPoolSize:              10,
  minPoolSize:              2,
  heartbeatFrequencyMS:     10000,
  retryWrites:              true,
  retryReads:               true,
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Auto-reconnect when Atlas drops idle connection
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — reconnecting in 5s...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS)
      .then(() => logger.info('MongoDB reconnected'))
      .catch(err => logger.error('Reconnect failed: ' + err.message));
  }, 5000);
});

mongoose.connection.on('error',       err  => logger.error('MongoDB error: ' + err.message));
mongoose.connection.on('reconnected', ()   => logger.info('MongoDB reconnected'));

// Keep-alive ping every 25s — prevents Atlas free tier idle timeout
setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    try { await mongoose.connection.db.admin().ping(); }
    catch { /* reconnect fires automatically */ }
  }
}, 25000);

module.exports = connectDB;