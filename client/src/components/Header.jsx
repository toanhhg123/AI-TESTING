import { Menu, Search, ShoppingCart, Smartphone, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink className="brand" to="/">
          <Smartphone size={24} />
          <span>Mobile Store</span>
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
          <NavLink to="/cart">Giỏ hàng</NavLink>
          <NavLink to="/orders">Đơn hàng</NavLink>
        </nav>

        <div className="header-actions">
          <NavLink className="icon-button" to="/products" aria-label="Tìm kiếm">
            <Search size={20} />
          </NavLink>
          <NavLink className="icon-button" to="/cart" aria-label="Giỏ hàng">
            <ShoppingCart size={20} />
          </NavLink>
          <NavLink className="icon-button" to="/login" aria-label="Tài khoản">
            <User size={20} />
          </NavLink>
          <button className="icon-button mobile-menu" type="button" aria-label="Mở menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
