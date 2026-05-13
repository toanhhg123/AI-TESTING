const stats = [
  { label: 'Doanh thu tháng', value: '128.5M' },
  { label: 'Đơn hàng mới', value: '42' },
  { label: 'Sản phẩm sắp hết', value: '8' },
  { label: 'Khách hàng', value: '1.240' },
];

export default function AdminDashboardPage() {
  return (
    <section className="admin-page">
      <p className="eyebrow">Admin</p>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        {stats.map((stat) => (
          <article className="stat-item" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
      <div className="placeholder-panel">Khu vực biểu đồ doanh thu theo tháng/quý.</div>
    </section>
  );
}
