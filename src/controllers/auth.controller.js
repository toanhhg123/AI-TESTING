const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Otp = require('../models/Otp');
const mailService = require('../services/mail.service');
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

    if (user.status === 'blocked') {
      return res.status(403).json({
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
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

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ email.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire OTP in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save/overwrite OTP in database
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send email using mailService
    await mailService.sendMail({
      to: normalizedEmail,
      subject: '[Mobile Store] Mã OTP đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; text-align: center; margin-bottom: 24px;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="color: #334155; font-size: 0.95rem; line-height: 1.6;">Chào bạn,</p>
          <p style="color: #334155; font-size: 0.95rem; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Mobile Store</strong>. Vui lòng sử dụng mã OTP dưới đây để tiến hành xác minh:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 2.2rem; font-weight: 800; color: #10b981; letter-spacing: 6px; padding: 12px 28px; background: #ecfdf5; border-radius: 8px; border: 1px dashed #10b981; display: inline-block;">
              ${otp}
            </span>
          </div>

          <p style="color: #ef4444; font-size: 0.88rem; font-weight: 600;">Lưu ý: Mã OTP này có hiệu lực trong vòng 10 phút.</p>
          <p style="color: #64748b; font-size: 0.88rem; line-height: 1.6;">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này. Bảo mật tài khoản của bạn luôn là ưu tiên hàng đầu của chúng tôi.</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="text-align: center; font-size: 0.8rem; color: #94a3b8; margin: 0;">Hệ thống Mobile Store - Đồ án tốt nghiệp</p>
        </div>
      `,
    });

    res.json({
      message: 'Mã OTP đặt lại mật khẩu đã được gửi về hòm thư của bạn.',
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Mã OTP không chính xác hoặc đã hết hạn.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng để cập nhật.' });
    }

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
};
