const jwt = require('jsonwebtoken');

const env = require('../config/env');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        message: 'Vui lòng đăng nhập để tiếp tục.',
      });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: 'Tài khoản không tồn tại hoặc token không hợp lệ.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }
}

module.exports = {
  authenticate,
};
