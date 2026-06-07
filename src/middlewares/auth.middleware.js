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

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Vui lòng đăng nhập để tiếp tục.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
