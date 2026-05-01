const Billing = require('../models/Billing');
const UsageLog = require('../models/UsageLog');
const User = require('../models/User');

// @desc    Get billing history
// @route   GET /api/billing
exports.getBillingHistory = async (req, res, next) => {
  try {
    const bills = await Billing.find({ user: req.user._id })
      .populate('breakdown.api', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { next(err); }
};

// @desc    Get current month billing
// @route   GET /api/billing/current
exports.getCurrentBilling = async (req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await UsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$api',
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } }
        }
      }
    ]);

    const user = req.user;
    const freeLimit = user.planLimits?.requestsPerMonth || 1000;
    const pricePerRequest = 0.005; // INR per request after free tier

    let totalRequests = usage.reduce((sum, u) => sum + u.requests, 0);
    let billableRequests = Math.max(0, totalRequests - freeLimit);
    let amount = billableRequests * pricePerRequest;

    res.json({
      success: true,
      data: {
        period: { start, end },
        totalRequests,
        freeRequests: Math.min(totalRequests, freeLimit),
        billableRequests,
        amount: parseFloat(amount.toFixed(2)),
        currency: 'INR',
        breakdown: usage
      }
    });
  } catch (err) { next(err); }
};

// @desc    Get invoice by ID
// @route   GET /api/billing/:id
exports.getInvoice = async (req, res, next) => {
  try {
    const bill = await Billing.findOne({ _id: req.params.id, user: req.user._id })
      .populate('breakdown.api', 'name');
    if (!bill) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: bill });
  } catch (err) { next(err); }
};

// @desc    Upgrade plan
// @route   POST /api/billing/upgrade
exports.upgradePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user._id);
    user.plan = plan;
    user.setPlanLimits();
    await user.save();
    res.json({ success: true, message: `Upgraded to ${plan}`, user });
  } catch (err) { next(err); }
};
