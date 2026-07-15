import { AlertCircle, ArrowDownRight, ArrowUpRight, ShoppingBag, TrendingUp, Users, DollarSign, Percent, Award, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getDashboardStats } from '../../api/adminApi';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Date filters local states
  const [filterType, setFilterType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().substring(0, 10);
  });
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  async function loadStats() {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        filterType,
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
      };

      const response = await getDashboardStats(params);
      setData(response.data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
      setError('Không thể tải dữ liệu thống kê từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }

  // Reload stats whenever filters change
  useEffect(() => {
    loadStats();
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

  function formatPrice(amount) {
    return amount !== undefined ? amount.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  }

  const { stats, revenueChart, topProducts, recentActivities } = data || {};

  const revenueLabel = {
    day: 'Doanh thu trong ngày',
    month: 'Doanh thu trong tháng',
    year: 'Doanh thu trong năm',
    all: 'Doanh thu toàn thời gian',
  }[filterType];

  const ordersLabel = {
    day: 'Đơn hàng trong ngày',
    month: 'Đơn hàng trong tháng',
    year: 'Đơn hàng trong năm',
    all: 'Đơn hàng toàn thời gian',
  }[filterType];

  const statItems = stats ? [
    {
      label: revenueLabel,
      value: formatPrice(stats.monthlyRevenue),
      trend: stats.revenueTrend !== null ? `${Number(stats.revenueTrend) >= 0 ? '+' : ''}${stats.revenueTrend}%` : null,
      trendUp: stats.revenueTrend !== null ? Number(stats.revenueTrend) >= 0 : null,
      icon: TrendingUp,
    },
    {
      label: ordersLabel,
      value: `${stats.newOrdersCount} đơn`,
      trend: stats.ordersTrend !== null ? `${Number(stats.ordersTrend) >= 0 ? '+' : ''}${stats.ordersTrend}%` : null,
      trendUp: stats.ordersTrend !== null ? Number(stats.ordersTrend) >= 0 : null,
      icon: ShoppingBag,
    },
    {
      label: 'Sản phẩm sắp hết',
      value: `${stats.lowStockCount} sản phẩm`,
      icon: AlertCircle,
      subText: 'Tồn kho từ 5 máy trở xuống',
      alert: stats.lowStockCount > 0,
    },
    {
      label: 'Khách hàng',
      value: stats.totalCustomers.toLocaleString('vi-VN'),
      icon: Users,
      subText: 'Tài khoản người dùng',
    },
    {
      label: 'Tổng doanh thu lũy kế',
      value: formatPrice(stats.totalRevenueAccumulated),
      icon: DollarSign,
      subText: 'Toàn bộ lịch sử bán',
    },
    {
      label: 'Tỷ lệ hủy đơn',
      value: `${stats.cancellationRate}%`,
      icon: Percent,
      subText: 'Số đơn bị hủy trong kỳ',
      isWarning: Number(stats.cancellationRate) > 20,
    },
  ] : [];

  return (
    <section className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Dashboard</h1>
          <p>Xem tổng quan tình hình kinh doanh, doanh thu và các hoạt động thực tế trên hệ thống.</p>
        </div>
      </div>

      {/* Date Range Filter toolbar */}
      <div className="admin-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
          <Calendar size={18} style={{ color: 'var(--accent)' }} />
          <span>Bộ lọc doanh thu:</span>
        </div>

        <select
          className="admin-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.9rem', outline: 'none' }}
        >
          <option value="all">Tất cả thời gian</option>
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
        </select>

        {filterType === 'day' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.9rem', outline: 'none' }}
          />
        )}

        {filterType === 'month' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="admin-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.9rem', outline: 'none' }}
            >
              {Array.from({ length: 12 }, (_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Tháng {idx + 1}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="2020"
              max="2035"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
              style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        )}

        {filterType === 'year' && (
          <input
            type="number"
            min="2020"
            max="2035"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
            style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.9rem', outline: 'none' }}
          />
        )}

        {data && (
          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginLeft: 'auto', background: 'var(--soft)', padding: '6px 12px', borderRadius: '20px' }}>
            Chu kỳ: {stats.labelPeriod}
          </span>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {isLoading && !data ? (
        <div className="empty-state">Đang tải số liệu thống kê...</div>
      ) : (
        <>
          {/* Grid of stats */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {statItems.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <article className="stat-item" key={idx} style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.label}</span>
                    <div style={{ padding: '8px', borderRadius: '8px', background: stat.alert ? '#fef2f2' : 'var(--background)', color: stat.alert ? '#ef4444' : 'var(--accent)' }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>{stat.value}</strong>
                  
                  {stat.trend !== null && (
                    <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: stat.trendUp ? '#10b981' : '#ef4444' }}>
                      {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{stat.trend} so với kỳ trước</span>
                    </div>
                  )}

                  {stat.subText && (
                    <div style={{ fontSize: '0.78rem', color: stat.isWarning ? '#ef4444' : 'var(--text-muted)' }}>
                      {stat.subText}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="dashboard-grid">
            {/* Revenue Chart */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3>Biểu đồ doanh thu ({filterType === 'year' ? '12 tháng trong năm' : filterType === 'day' ? '6 ngày gần đây' : '6 tháng gần đây'})</h3>
              </div>
              <div className="chart-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '200px', padding: '10px 0 20px 0', borderBottom: '1px solid var(--border)' }}>
                {revenueChart.map((item, idx) => (
                  <div className="chart-bar-wrapper" key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: item.height, 
                        width: filterType === 'year' ? '16px' : '32px', 
                        background: 'var(--accent)', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                        cursor: 'pointer'
                      }}
                      data-value={item.value}
                    ></div>
                    <span className="chart-label" style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', whiteSpace: 'nowrap' }}>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real dynamic recent activities */}
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

          {/* Top best selling products */}
          <div className="dashboard-card" style={{ marginTop: '28px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Award size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0 }}>Top sản phẩm bán chạy nhất trong kỳ</h3>
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Thương hiệu</th>
                    <th>Giá bán</th>
                    <th>Số lượng đã bán</th>
                    <th>Tồn kho còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => {
                    const hasSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
                    const finalPrice = hasSale ? p.salePrice : p.price;
                    return (
                      <tr key={p._id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                          <strong style={{ color: 'var(--ink)' }}>{p.name}</strong>
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(finalPrice)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.soldCount} máy</td>
                        <td style={{ color: p.stock <= 5 ? '#ef4444' : 'inherit', fontWeight: p.stock <= 5 ? 700 : 'normal' }}>
                          {p.stock} máy {p.stock <= 5 && '(Sắp hết)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
