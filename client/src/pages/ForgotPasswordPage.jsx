import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

import { forgotPassword, resetPassword } from '../api/authApi';
import PageHeader from '../components/PageHeader.jsx';
import { useNotification } from '../components/NotificationProvider.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      showToast(response.data.message || 'Mã OTP đã được gửi đến email của bạn.', 'success');
      setStep(2);
    } catch (err) {
      console.error('Lỗi yêu cầu OTP:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const response = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword,
      });
      showToast(response.data.message || 'Đặt lại mật khẩu thành công!', 'success');
      navigate('/login');
    } catch (err) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      setErrorMessage(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container page narrow-page">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          Quay lại Đăng nhập
        </Link>
      </div>

      <PageHeader 
        eyebrow="Tài khoản" 
        title="Quên mật khẩu" 
        description={step === 1 
          ? "Nhập email của bạn để nhận mã xác minh OTP đặt lại mật khẩu." 
          : `Nhập mã OTP đã được gửi đến hòm thư ${email} và mật khẩu mới.`
        }
      />

      {step === 1 ? (
        <form className="auth-form" onSubmit={handleSendOtp} style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="forgotEmail" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={16} style={{ color: 'var(--muted)' }} />
              Địa chỉ Email tài khoản
            </label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="nhap-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {errorMessage && <p className="form-message error" style={{ marginBottom: '16px' }}>{errorMessage}</p>}

          <button className="button primary" type="submit" disabled={isLoading} style={{ width: '100%', minHeight: '44px' }}>
            {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác minh OTP'}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword} style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="otpInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--muted)' }} />
              Mã xác minh OTP (6 chữ số)
            </label>
            <input
              id="otpInput"
              type="text"
              maxLength="6"
              placeholder="Nhập 6 chữ số"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ letterSpacing: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="newPassInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} style={{ color: 'var(--muted)' }} />
              Mật khẩu mới
            </label>
            <input
              id="newPassInput"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="confirmPassInput">Xác nhận mật khẩu mới</label>
            <input
              id="confirmPassInput"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && <p className="form-message error" style={{ marginBottom: '16px' }}>{errorMessage}</p>}

          <button className="button primary" type="submit" disabled={isLoading} style={{ width: '100%', minHeight: '44px', marginBottom: '12px' }}>
            {isLoading ? 'Đang xác minh...' : 'Đặt lại mật khẩu mới'}
          </button>

          <button 
            className="button secondary" 
            type="button" 
            onClick={() => setStep(1)} 
            disabled={isLoading}
            style={{ width: '100%', minHeight: '44px' }}
          >
            Quay lại nhập Email
          </button>
        </form>
      )}
    </div>
  );
}
