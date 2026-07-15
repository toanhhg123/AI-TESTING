import { BarChart3, Boxes, ClipboardList, Home, Users, Package, Folder, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { clearAuthSession, getStoredUser, onAuthChanged } from '../utils/authStorage';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Boxes },
  { to: '/admin/categories', label: 'Danh mục', icon: Folder },
  { to: '/admin/inventory', label: 'Kho hàng', icon: Package },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: Ticket },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    return onAuthChanged(() => {
      setCurrentUser(getStoredUser());
    });
  }, []);

  function handleLogout() {
    clearAuthSession();
    navigate('/admin/login');
  }

  if (currentUser?.role !== 'admin') {
    return (
      <main className="admin-auth-wall">
        <section className="placeholder-panel admin-auth-panel">
          <p className="eyebrow">Admin</p>
          <h1>Yêu cầu quyền quản trị</h1>
          <p>Vui lòng đăng nhập bằng tài khoản admin để truy cập khu vực quản trị hệ thống.</p>
          <Link className="button primary" to="/admin/login">
            Đăng nhập admin
          </Link>
        </section>
      </main>
    );
  }

  const avatarInitial = currentUser?.fullName ? currentUser.fullName.trim().charAt(0).toUpperCase() : 'A';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="brand admin-brand" to="/">
          <Home size={22} />
          <span>Mobile Store</span>
        </NavLink>

        <nav className="admin-nav">
          {adminLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="admin-link">
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-user-box">
          <div className="admin-user-info-card">
            <div className="admin-avatar">{avatarInitial}</div>
            <div className="admin-user-meta">
              <span>{currentUser.fullName}</span>
              <strong>{currentUser.email}</strong>
            </div>
          </div>
          <button className="admin-logout-btn" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
