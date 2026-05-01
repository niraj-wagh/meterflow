const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');
const UsageLog = require('../models/UsageLog');
const axios = require('axios');

// Middleware: validate API key from header
const validateApiKey = async (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ success: false, message: 'API key required. Pass X-Api-Key header.' });

  const apiKey = await ApiKey.findOne({ key, status: 'active' }).populate('api');
  if (!apiKey) return res.status(401).json({ success: false, message: 'Invalid or revoked API key' });

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    apiKey.status = 'expired';
    await apiKey.save();
    return res.status(401).json({ success: false, message: 'API key expired' });
  }

  if (!apiKey.api || apiKey.api.status !== 'active') {
    return res.status(403).json({ success: false, message: 'API is inactive' });
  }

  req.apiKey = apiKey;
  req.apiDoc = apiKey.api;
  next();
};

// Main gateway handler
const handleGatewayRequest = async (req, res) => {
  const startTime = Date.now();
  const { apiKey, apiDoc } = req;
  const targetPath = req.params[0] || '/';

  let statusCode = 200;
  let isError = false;
  let errorMessage = null;
  let responseSize = 0;

  try {
    const targetUrl = `${apiDoc.baseUrl}${targetPath}`;
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: { ...req.query },
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MeterFlow-Gateway/1.0'
      },
      timeout: 15000,
      validateStatus: () => true
    });

    statusCode = response.status;
    isError = statusCode >= 400;
    const responseData = response.data;
    responseSize = JSON.stringify(responseData).length;

    // Update key last used
    apiKey.lastUsed = new Date();
    apiKey.totalRequests++;
    if (isError) apiKey.totalErrors++;
    await apiKey.save();

    // Log usage
    const latency = Date.now() - startTime;
    const log = await UsageLog.create({
      apiKey: apiKey._id, api: apiDoc._id, user: apiKey.owner,
      endpoint: targetPath, method: req.method,
      statusCode, latency, isError, errorMessage,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      responseSize, cost: 0.005
    });

    // Emit real-time event
    if (global.io) {
      global.io.to(`user-${apiKey.owner}`).emit('new-request', {
        endpoint: targetPath, statusCode, latency, isError, timestamp: new Date()
      });
      global.io.to('admin-room').emit('platform-request', {
        userId: apiKey.owner, apiName: apiDoc.name, statusCode, latency
      });
    }

    res.setHeader('X-MeterFlow-RequestId', log._id.toString());
    res.setHeader('X-MeterFlow-Latency', latency);
    res.status(statusCode).json(responseData);

  } catch (err) {
    statusCode = 502;
    isError = true;
    errorMessage = err.message;
    const latency = Date.now() - startTime;

    await UsageLog.create({
      apiKey: apiKey._id, api: apiDoc._id, user: apiKey.owner,
      endpoint: targetPath, method: req.method,
      statusCode, latency, isError, errorMessage,
      ipAddress: req.ip, cost: 0
    });

    res.status(502).json({ success: false, message: 'Gateway error', detail: err.message });
  }
};

module.exports = { validateApiKey, handleGatewayRequest };
