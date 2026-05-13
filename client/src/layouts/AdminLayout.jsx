import { BarChart3, Boxes, ClipboardList, Home, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Boxes },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="brand admin-brand" to="/">
          <Home size={20} />
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
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
