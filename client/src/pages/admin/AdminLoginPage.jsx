import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../../api/authApi';
import { clearAuthSession, saveAuthSession } from '../../utils/authStorage';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: 'admin@example.com',
    password: '123456',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await login(form);
      const { user } = response.data;

      if (user.role !== 'admin') {
        clearAuthSession();
        setErrorMessage('Tài khoản này không có quyền quản trị.');
        return;
      }

      saveAuthSession(response.data);
      navigate('/admin/products');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể đăng nhập admin.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-icon">
          <ShieldCheck size={28} />
        </div>
        <p className="eyebrow">Admin</p>
        <h1>Đăng nhập quản trị</h1>
        <p>Truy cập khu vực quản lý sản phẩm, đơn hàng, người dùng và dashboard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email admin
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="admin@example.com"
              onChange={updateField}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              name="password"
              value={form.password}
              placeholder="••••••••"
              onChange={updateField}
              required
            />
          </label>

          {errorMessage ? <p className="form-message error">{errorMessage}</p> : null}

          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập admin'}
          </button>

          <p className="auth-hint">
            Tài khoản demo: <strong>admin@example.com</strong> / <strong>123456</strong>
          </p>
          <p className="auth-switch">
            Quay lại <Link to="/">trang khách hàng</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
