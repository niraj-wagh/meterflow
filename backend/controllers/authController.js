const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, company, role } = req.body;

    // Prevent self-assigning admin role
    const assignedRole = role === 'admin' ? 'api_owner' : (role || 'api_owner');

    const user = await User.create({ name, email, password, company, role: assignedRole });

    await AuditLog.create({ user: user._id, action: 'USER_REGISTER', ipAddress: req.ip });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({ user: user._id, action: 'USER_LOGIN', ipAddress: req.ip });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token provided' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired. Please log in again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, company } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, company }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  await AuditLog.create({ user: req.user._id, action: 'USER_LOGOUT', ipAddress: req.ip });
  res.json({ success: true, message: 'Logged out successfully' });
};
