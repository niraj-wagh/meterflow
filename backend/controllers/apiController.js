const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
const AuditLog = require('../models/AuditLog');

// @desc    Create API
// @route   POST /api/apis
exports.createApi = async (req, res, next) => {
  try {
    const api = await Api.create({ ...req.body, owner: req.user._id });
    await AuditLog.create({ user: req.user._id, action: 'API_CREATED', resourceId: api._id });
    res.status(201).json({ success: true, data: api });
  } catch (err) { next(err); }
};

// @desc    Get my APIs
// @route   GET /api/apis
exports.getMyApis = async (req, res, next) => {
  try {
    const apis = await Api.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: apis.length, data: apis });
  } catch (err) { next(err); }
};

// @desc    Get single API
// @route   GET /api/apis/:id
exports.getApi = async (req, res, next) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, owner: req.user._id });
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });
    res.json({ success: true, data: api });
  } catch (err) { next(err); }
};

// @desc    Update API
// @route   PUT /api/apis/:id
exports.updateApi = async (req, res, next) => {
  try {
    const api = await Api.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });
    res.json({ success: true, data: api });
  } catch (err) { next(err); }
};

// @desc    Delete API
// @route   DELETE /api/apis/:id
exports.deleteApi = async (req, res, next) => {
  try {
    const api = await Api.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });
    await ApiKey.updateMany({ api: api._id }, { status: 'revoked' });
    res.json({ success: true, message: 'API deleted' });
  } catch (err) { next(err); }
};
