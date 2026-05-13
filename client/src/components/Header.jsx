import { ChevronDown, LogOut, Search, Smartphone, User, UserPlus, X, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { clearAuthSession, getStoredUser, onAuthChanged } from '../utils/authStorage';

const mainLinks = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/cart', label: 'Giỏ hàng' },
  { to: '/orders', label: 'Đơn hàng' },
];

const dropdownLinks = [
  { to: '/products', label: 'Tìm kiếm sản phẩm', icon: Search },
];

const guestLinks = [
  { to: '/login', label: 'Đăng nhập', icon: User },
  { to: '/register', label: 'Đăng ký', icon: UserPlus },
];

export default function Header() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    return onAuthChanged(() => {
      setCurrentUser(getStoredUser());
    });
  }, []);

  function closeMenus() {
    setIsAccountOpen(false);
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    clearAuthSession();
    closeMenus();
  }

  const accountLinks = currentUser ? dropdownLinks : [...dropdownLinks, ...guestLinks];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink className="brand" to="/">
          <Smartphone size={24} />
          <span>Mobile Store</span>
        </NavLink>

        <nav className="main-nav">
          {mainLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <div className="account-menu desktop-actions">
            <button
              className="account-trigger"
              type="button"
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
              onClick={() => setIsAccountOpen((current) => !current)}
            >
              <User size={18} />
              <span>{currentUser?.fullName || 'Tài khoản'}</span>
              <ChevronDown size={16} />
            </button>

            {isAccountOpen ? (
              <div className="account-dropdown" role="menu">
                {accountLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <NavLink key={link.label} to={link.to} role="menuitem" onClick={closeMenus}>
                      <Icon size={17} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}

                {currentUser ? (
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <LogOut size={17} />
                    <span>Đăng xuất</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="mobile-nav-panel">
          <nav className="container mobile-nav">
            {mainLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMenus}>
                {link.label}
              </NavLink>
            ))}

            <div className="mobile-nav-divider" />

            {accountLinks.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink key={link.label} to={link.to} onClick={closeMenus}>
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}

            {currentUser ? (
              <button type="button" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
