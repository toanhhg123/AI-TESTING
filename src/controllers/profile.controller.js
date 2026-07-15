const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sanitizeUser } = require('../utils/auth');

async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, shippingAddress } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({ message: 'Họ tên không được để trống.' });
      }
      user.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (shippingAddress !== undefined) {
      user.shippingAddress = shippingAddress.trim();
    }

    await user.save();
    res.json({
      message: 'Cập nhật thông tin cá nhân thành công.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền mật khẩu cũ và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateProfile,
  changePassword,
};
