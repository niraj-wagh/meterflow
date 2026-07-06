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
const authRoutes     = require('./routes/auth');
const apiRoutes      = require('./routes/apis');
const apiKeyRoutes   = require('./routes/apiKeys');
const usageRoutes    = require('./routes/usage');
const billingRoutes  = require('./routes/billing');
const gatewayRoutes  = require('./routes/gateway');
const adminRoutes    = require('./routes/admin');
const webhookRoutes  = require('./routes/webhooks');
const analyticsRoutes = require('./routes/analytics');

const app    = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow all Vercel preview URLs + your production domain
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,                          // e.g. https://meterflow-steel.vercel.app
  'http://localhost:3000',
  'http://localhost:5173',
  /\.vercel\.app$/,                                // any *.vercel.app preview URL
  /\.onrender\.com$/,                              // render previews
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = ALLOWED_ORIGINS.some(o => {
      if (!o) return false;
      if (o instanceof RegExp) return o.test(origin);
      return o === origin;
    });

    if (allowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      // In production still allow — just log it
      // Change to callback(new Error('CORS')) to strictly block
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
};

app.use(cors(corsOptions));
// Handle preflight for ALL routes
app.options('*', cors(corsOptions));

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
global.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Health check (Render uses this to detect the service is alive) ────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/apis',      apiRoutes);
app.use('/api/keys',      apiKeyRoutes);
app.use('/api/usage',     usageRoutes);
app.use('/api/billing',   billingRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/webhooks',  webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/gateway',       gatewayRoutes);

// ── Socket.io connections ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-user-room',  (userId) => socket.join(`user-${userId}`));
  socket.on('join-admin-room', ()       => socket.join('admin-room'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Connect DB then start server ──────────────────────────────────────────────
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`MeterFlow server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Client URL: ${process.env.CLIENT_URL || 'not set'}`);
  });
});

module.exports = { app, io };