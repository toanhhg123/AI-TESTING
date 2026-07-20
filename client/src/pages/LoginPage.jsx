import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../api/authApi';
import PageHeader from '../components/PageHeader.jsx';
import { saveAuthSession } from '../utils/authStorage';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: 'customer@example.com',
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

      saveAuthSession(response.data);
      navigate('/');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container page narrow-page">
      <PageHeader eyebrow="Tài khoản" title="Đăng nhập" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            placeholder="customer@example.com"
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
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <p className="auth-hint">
          Tài khoản demo: <strong>customer@example.com</strong> / <strong>123456</strong>
        </p>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
        <p className="auth-switch" style={{ marginTop: '10px' }}>
          Quên mật khẩu? <Link to="/forgot-password">Đặt lại mật khẩu</Link>
        </p>
      </form>
    </div>
  );
}
