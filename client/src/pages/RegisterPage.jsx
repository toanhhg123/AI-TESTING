import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../api/authApi';
import PageHeader from '../components/PageHeader.jsx';
import { saveAuthSession } from '../utils/authStorage';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
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
      const response = await register(form);

      saveAuthSession(response.data);
      navigate('/');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container page narrow-page">
      <PageHeader eyebrow="Tài khoản" title="Đăng ký" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Họ tên
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            placeholder="Nguyễn Văn A"
            onChange={updateField}
            required
          />
        </label>
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
            minLength={6}
            required
          />
        </label>

        {errorMessage ? <p className="form-message error">{errorMessage}</p> : null}

        <button className="button primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
