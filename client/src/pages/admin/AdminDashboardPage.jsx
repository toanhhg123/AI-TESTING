import { AlertCircle, ArrowDownRight, ArrowUpRight, ShoppingBag, TrendingUp, Users } from 'lucide-react';

const stats = [
  {
    label: 'Doanh thu tháng',
    value: '128.5M đ',
    trend: '+12.5%',
    trendUp: true,
    icon: TrendingUp,
  },
  {
    label: 'Đơn hàng mới',
    value: '42 đơn',
    trend: '+8.2%',
    trendUp: true,
    icon: ShoppingBag,
  },
  {
    label: 'Sản phẩm sắp hết',
    value: '8 sản phẩm',
    trend: '-3%',
    trendUp: false,
    icon: AlertCircle,
  },
  {
    label: 'Khách hàng',
    value: '1.240',
    trend: '+15%',
    trendUp: true,
    icon: Users,
  },
];

const mockRevenueData = [
  { month: 'T1', value: '45M đ', height: '35%' },
  { month: 'T2', value: '62M đ', height: '48%' },
  { month: 'T3', value: '58M đ', height: '45%' },
  { month: 'T4', value: '89M đ', height: '70%' },
  { month: 'T5', value: '110M đ', height: '85%' },
  { month: 'T6', value: '128.5M đ', height: '100%' },
];

const recentActivities = [
  {
    id: 1,
    type: 'order',
    text: 'Đơn hàng mới #DH-8942 được tạo bởi Nguyen Van A.',
    time: '10 phút trước',
  },
  {
    id: 2,
    type: 'user',
    text: 'Người dùng mới Le Thi B đã đăng ký tài khoản thành công.',
    time: '32 phút trước',
  },
  {
    id: 3,
    type: 'product',
    text: 'Sản phẩm iPhone 15 128GB đã được cập nhật tồn kho (+10).',
    time: '2 giờ trước',
  },
  {
    id: 4,
    type: 'order',
    text: 'Đơn hàng #DH-8940 đã được chuyển sang trạng thái "Đang giao".',
    time: '4 giờ trước',
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Dashboard</h1>
          <p>Xem tổng quan tình hình kinh doanh, doanh thu và các hoạt động mới nhất.</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-item" key={stat.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{stat.label}</span>
                <Icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <strong>{stat.value}</strong>
              <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Doanh thu 6 tháng qua</h3>
          </div>
          <div className="chart-container">
            {mockRevenueData.map((data) => (
              <div className="chart-bar-wrapper" key={data.month}>
                <div 
                  className="chart-bar" 
                  style={{ height: data.height }}
                  data-value={data.value}
                ></div>
                <span className="chart-label">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Hoạt động mới nhất</h3>
          <div className="activity-list">
            {recentActivities.map((act) => (
              <div className="activity-item" key={act.id}>
                <div className={`activity-icon ${act.type}`}>
                  {act.type === 'order' && <ShoppingBag size={16} />}
                  {act.type === 'user' && <Users size={16} />}
                  {act.type === 'product' && <AlertCircle size={16} />}
                </div>
                <div className="activity-details">
                  <p>{act.text}</p>
                  <div className="activity-time">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
