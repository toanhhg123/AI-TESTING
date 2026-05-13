import PageHeader from '../components/PageHeader.jsx';

export default function LoginPage() {
  return (
    <div className="container page narrow-page">
      <PageHeader eyebrow="Tài khoản" title="Đăng nhập" />
      <form className="auth-form">
        <label>
          Email
          <input type="email" placeholder="customer@example.com" />
        </label>
        <label>
          Mật khẩu
          <input type="password" placeholder="••••••••" />
        </label>
        <button className="button primary" type="button">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
