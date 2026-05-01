const jwt = require('jsonwebtoken');

// Fallback so missing env vars don't produce "secretOrPrivateKey must have a value" crash
const ACCESS_SECRET = process.env.JWT_SECRET || 'meterflow_access_secret_changeme';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'meterflow_refresh_secret_changeme';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: userObj
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sendTokenResponse
};
