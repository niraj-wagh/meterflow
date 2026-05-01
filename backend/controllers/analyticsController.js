const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [stats] = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalErrors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' },
          p99Latency: { $percentile: { input: '$latency', p: [0.99], method: 'approximate' } }
        }
      }
    ]);

    const apiCount = await Api.countDocuments({ owner: req.user._id, status: 'active' });
    const keyCount = await ApiKey.countDocuments({ owner: req.user._id, status: 'active' });

    res.json({
      success: true,
      data: {
        totalRequests: stats?.totalRequests || 0,
        errorRate: stats?.totalRequests ? ((stats.totalErrors / stats.totalRequests) * 100).toFixed(2) : 0,
        avgLatency: stats?.avgLatency ? Math.round(stats.avgLatency) : 0,
        activeApis: apiCount,
        activeKeys: keyCount
      }
    });
  } catch (err) { next(err); }
};

// @desc    Get requests over time (chart data)
// @route   GET /api/analytics/requests
exports.getRequestsOverTime = async (req, res, next) => {
  try {
    const { period = '7d', apiId } = req.query;
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const format = days === 1 ? '%Y-%m-%dT%H:00' : '%Y-%m-%d';

    const match = { user: req.user._id, timestamp: { $gte: since } };
    if (apiId) match.api = require('mongoose').Types.ObjectId(apiId);

    const data = await UsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$timestamp' } },
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @desc    Top APIs by usage
// @route   GET /api/analytics/top-apis
exports.getTopApis = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: since } } },
      { $group: { _id: '$api', requests: { $sum: 1 }, errors: { $sum: { $cond: ['$isError', 1, 0] } }, avgLatency: { $avg: '$latency' } } },
      { $sort: { requests: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'apis', localField: '_id', foreignField: '_id', as: 'api' } },
      { $unwind: '$api' },
      { $project: { name: '$api.name', requests: 1, errors: 1, avgLatency: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @desc    Latency percentiles
// @route   GET /api/analytics/latency
exports.getLatency = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const data = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          p50: { $percentile: { input: '$latency', p: [0.5], method: 'approximate' } },
          p95: { $percentile: { input: '$latency', p: [0.95], method: 'approximate' } },
          p99: { $percentile: { input: '$latency', p: [0.99], method: 'approximate' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
