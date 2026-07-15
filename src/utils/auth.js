const jwt = require('jsonwebtoken');

const env = require('../config/env');

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    shippingAddress: user.shippingAddress || '',
  };
}

module.exports = {
  createAccessToken,
  sanitizeUser,
};
