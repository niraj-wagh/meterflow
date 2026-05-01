const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');
const AuditLog = require('../models/AuditLog');

// @desc    Generate API Key
// @route   POST /api/keys
exports.generateKey = async (req, res, next) => {
  try {
    const { apiId, name, rateLimit, expiresAt, allowedIPs, allowedDomains } = req.body;
    const api = await Api.findOne({ _id: apiId, owner: req.user._id });
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });

    const apiKey = await ApiKey.create({
      api: apiId, owner: req.user._id, name,
      rateLimit: rateLimit || api.rateLimit,
      expiresAt, allowedIPs, allowedDomains
    });

    await AuditLog.create({ user: req.user._id, action: 'API_KEY_GENERATED', resourceId: apiKey._id });
    res.status(201).json({ success: true, data: apiKey });
  } catch (err) { next(err); }
};

// @desc    Get all keys for user
// @route   GET /api/keys
exports.getMyKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ owner: req.user._id })
      .populate('api', 'name baseUrl').sort({ createdAt: -1 });
    res.json({ success: true, count: keys.length, data: keys });
  } catch (err) { next(err); }
};

// @desc    Get keys for a specific API
// @route   GET /api/keys/api/:apiId
exports.getKeysByApi = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ api: req.params.apiId, owner: req.user._id });
    res.json({ success: true, count: keys.length, data: keys });
  } catch (err) { next(err); }
};

// @desc    Revoke API Key
// @route   PUT /api/keys/:id/revoke
exports.revokeKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status: 'revoked' }, { new: true }
    );
    if (!key) return res.status(404).json({ success: false, message: 'Key not found' });
    await AuditLog.create({ user: req.user._id, action: 'API_KEY_REVOKED', resourceId: key._id });
    res.json({ success: true, data: key });
  } catch (err) { next(err); }
};

// @desc    Rotate API Key (generate new key string)
// @route   PUT /api/keys/:id/rotate
exports.rotateKey = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { key: `mf_${uuidv4().replace(/-/g, '')}` }, { new: true }
    );
    if (!key) return res.status(404).json({ success: false, message: 'Key not found' });
    await AuditLog.create({ user: req.user._id, action: 'API_KEY_ROTATED', resourceId: key._id });
    res.json({ success: true, data: key });
  } catch (err) { next(err); }
};

// @desc    Delete key
// @route   DELETE /api/keys/:id
exports.deleteKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!key) return res.status(404).json({ success: false, message: 'Key not found' });
    res.json({ success: true, message: 'Key deleted' });
  } catch (err) { next(err); }
};
