import { User, ShieldAlert, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import { updateProfile, changePassword } from '../api/authApi';
import { getStoredUser, saveAuthSession } from '../utils/authStorage';
import { useNotification } from '../components/NotificationProvider.jsx';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);
    setFullName(stored.fullName || '');
    setPhone(stored.phone || '');
    setShippingAddress(stored.shippingAddress || '');
  }, [navigate]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Họ tên không được để trống.');
      return;
    }

    setProfileError('');
    setIsUpdatingProfile(true);

    try {
      const response = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
      });

      // Update stored user
      const stored = getStoredUser();
      const updatedUser = { ...stored, ...response.data.user };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth:changed'));

      setUser(updatedUser);
      showToast('Cập nhật thông tin cá nhân thành công.', 'success');
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.';
      setProfileError(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ mật khẩu cũ và mới.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setPasswordError('');
    setIsChangingPassword(true);

    try {
      await changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Đổi mật khẩu thành công.', 'success');
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      const msg = err.response?.data?.message || 'Mật khẩu cũ không chính xác.';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Tài khoản"
        title="Trang cá nhân"
        description="Quản lý thông tin liên hệ, địa chỉ giao hàng và thay đổi mật khẩu tài khoản của bạn."
      />

      <div className="checkout-layout" style={{ marginTop: '24px' }}>
        {/* Left Column: Personal Info Form */}
        <div className="checkout-form-container">
          <div className="form-card">
            <h3 className="form-section-title">
              <User size={18} /> Thông tin cá nhân
            </h3>

            {profileError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Email tài khoản</label>
                <input type="text" value={user.email} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>Email không thể thay đổi</span>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="shippingAddress">Địa chỉ nhận hàng mặc định</label>
                <textarea
                  id="shippingAddress"
                  rows="3"
                  placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button type="submit" className="button primary" disabled={isUpdatingProfile} style={{ minHeight: '44px', width: '100%' }}>
                {isUpdatingProfile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="summary-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <h3 className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <Key size={18} style={{ color: 'var(--accent)' }} /> Đổi mật khẩu
          </h3>

          {passwordError && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="oldPassword" style={{ fontSize: '0.85rem' }}>Mật khẩu hiện tại</label>
              <input
                id="oldPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                style={{ padding: '10px 12px', fontSize: '0.9rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" style={{ fontSize: '0.85rem' }}>Mật khẩu mới</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ padding: '10px 12px', fontSize: '0.9rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" style={{ fontSize: '0.85rem' }}>Xác nhận mật khẩu mới</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: '10px 12px', fontSize: '0.9rem' }}
              />
            </div>

            <button type="submit" className="button secondary" disabled={isChangingPassword} style={{ minHeight: '44px', width: '100%', marginTop: '8px' }}>
              {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Thay đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
