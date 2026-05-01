// routes/usage.js
const express = require('express');
const router = express.Router();
const { getUsage, getUsageSummary, getRealtime } = require('../controllers/usageController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', getUsage);
router.get('/summary', getUsageSummary);
router.get('/realtime', getRealtime);
module.exports = router;
