const UsageLog = require('../models/UsageLog');

// @desc    Get usage logs for user
// @route   GET /api/usage
exports.getUsage = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, apiId, startDate, endDate, status } = req.query;
    const filter = { user: req.user._id };
    if (apiId) filter.api = apiId;
    if (status === 'error') filter.isError = true;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await UsageLog.find(filter)
      .populate('api', 'name').populate('apiKey', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await UsageLog.countDocuments(filter);
    res.json({ success: true, count: logs.length, total, data: logs });
  } catch (err) { next(err); }
};

// @desc    Get usage summary
// @route   GET /api/usage/summary
exports.getUsageSummary = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary] = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalErrors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    // Daily breakdown
    const daily = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: { summary: summary || {}, daily } });
  } catch (err) { next(err); }
};

// @desc    Get real-time stats (last hour)
// @route   GET /api/usage/realtime
exports.getRealtime = async (req, res, next) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const logs = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%dT%H:%M', date: '$timestamp' } },
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
