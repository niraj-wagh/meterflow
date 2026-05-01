const express = require('express');
const router = express.Router();
const { validateApiKey, handleGatewayRequest } = require('../controllers/gatewayController');
const { gatewayRateLimiter } = require('../middleware/rateLimiter');

// All gateway requests go through key validation then rate limiting
router.all('/*', validateApiKey, gatewayRateLimiter, handleGatewayRequest);

module.exports = router;
