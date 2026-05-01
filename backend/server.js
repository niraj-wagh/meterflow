const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/apis');
const apiKeyRoutes = require('./routes/apiKeys');
const usageRoutes = require('./routes/usage');
const billingRoutes = require('./routes/billing');
const gatewayRoutes = require('./routes/gateway');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible globally
global.io = io;

// Connect Database
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);

// API Gateway - proxies all external API requests through MeterFlow
app.use('/gateway', gatewayRoutes);

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('join-admin-room', () => {
    socket.join('admin-room');
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`MeterFlow server running on port ${PORT}`);
});

module.exports = { app, io };
