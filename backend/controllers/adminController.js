const User = require('../models/User');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const Billing = require('../models/Billing');
const AuditLog = require('../models/AuditLog');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalApis, totalKeys, recentUsage] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Api.countDocuments(),
      ApiKey.countDocuments({ status: 'active' }),
      UsageLog.aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: 1 }, errors: { $sum: { $cond: ['$isError', 1, 0] } }, avgLatency: { $avg: '$latency' } } }
      ])
    ]);

    const monthlyRevenue = await Billing.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: new Date(new Date().setDate(1)) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const planDistribution = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalApis, activeKeys: totalKeys,
        requestsToday: recentUsage[0]?.total || 0,
        errorRateToday: recentUsage[0]?.total
          ? ((recentUsage[0].errors / recentUsage[0].total) * 100).toFixed(1)
          : 0,
        avgLatency: Math.round(recentUsage[0]?.avgLatency || 0),
        monthlyRevenue: monthlyRevenue[0]?.total?.toFixed(2) || 0,
        planDistribution
      }
    });
  } catch (err) { next(err); }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, plan, role } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (plan) filter.plan = plan;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, count: users.length, total, data: users });
  } catch (err) { next(err); }
};

// @desc    Get platform-wide usage stats over time
// @route   GET /api/admin/usage
exports.getPlatformUsage = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const daily = await UsageLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
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
    res.json({ success: true, data: daily });
  } catch (err) { next(err); }
};

// @desc    Toggle user status
// @route   PUT /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await AuditLog.countDocuments();
    res.json({ success: true, count: logs.length, total, data: logs });
  } catch (err) { next(err); }
};
