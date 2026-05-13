import { Mail, MapPin, Phone, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-brand">
          <Link className="brand" to="/">
            <Smartphone size={24} />
            <span>Mobile Store</span>
          </Link>
          <p>
            Website bán thiết bị di động phục vụ đồ án tốt nghiệp, mô phỏng quy trình mua hàng,
            quản lý đơn hàng và hỗ trợ tư vấn sản phẩm.
          </p>
        </section>

        <section className="footer-column">
          <h3>Mua sắm</h3>
          <Link to="/products">Danh sách sản phẩm</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <Link to="/orders">Theo dõi đơn hàng</Link>
        </section>

        <section className="footer-column">
          <h3>Hỗ trợ</h3>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/register">Tạo tài khoản</Link>
          <Link to="/products">Tìm kiếm thông minh</Link>
        </section>

        <section className="footer-column contact-column">
          <h3>Liên hệ demo</h3>
          <p>
            <Phone size={16} />
            <span>0900 000 000</span>
          </p>
          <p>
            <Mail size={16} />
            <span>support@mobilestore.local</span>
          </p>
          <p>
            <MapPin size={16} />
            <span>TP. Hồ Chí Minh</span>
          </p>
        </section>
      </div>

      <div className="container footer-bottom">
        <p>Mobile Store - Đồ án website bán thiết bị di động.</p>
        <p>Node.js, React và MongoDB.</p>
      </div>
    </footer>
  );
}
