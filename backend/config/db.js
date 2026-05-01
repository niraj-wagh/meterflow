const mongoose = require('mongoose');
const logger = require('../utils/logger');

// These options prevent Atlas free-tier idle disconnections
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,           // keep min 2 connections alive
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    logger.info(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Auto-reconnect on disconnect (Atlas free tier drops idle connections)
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS)
      .then(() => logger.info('MongoDB reconnected successfully'))
      .catch(err => {
        logger.error('Reconnect failed: ' + err.message);
        // Retry again after 10s
        setTimeout(() => connectDB(), 10000);
      });
  }, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error: ' + err.message);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

// Keep-alive ping every 30s to prevent Atlas idle timeout
setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
    } catch {
      // ping failed, reconnect will trigger automatically
    }
  }
}, 30000);

module.exports = connectDB;