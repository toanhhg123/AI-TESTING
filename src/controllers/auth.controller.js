const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { createAccessToken, sanitizeUser } = require('../utils/auth');

function sendAuthResponse(res, user, statusCode = 200) {
  res.status(statusCode).json({
    accessToken: createAccessToken(user),
    user: sanitizeUser(user),
  });
}

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email này đã được sử dụng.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
    });

    sendAuthResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập email và mật khẩu.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  res.json({
    message: 'Đăng xuất thành công.',
  });
}

function getCurrentUser(req, res) {
  res.json({
    user: sanitizeUser(req.user),
  });
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
};
