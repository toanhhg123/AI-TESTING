import PageHeader from '../components/PageHeader.jsx';

export default function RegisterPage() {
  return (
    <div className="container page narrow-page">
      <PageHeader eyebrow="Tài khoản" title="Đăng ký" />
      <form className="auth-form">
        <label>
          Họ tên
          <input type="text" placeholder="Nguyễn Văn A" />
        </label>
        <label>
          Email
          <input type="email" placeholder="customer@example.com" />
        </label>
        <label>
          Mật khẩu
          <input type="password" placeholder="••••••••" />
        </label>
        <button className="button primary" type="button">
          Tạo tài khoản
        </button>
      </form>
    </div>
  );
}
