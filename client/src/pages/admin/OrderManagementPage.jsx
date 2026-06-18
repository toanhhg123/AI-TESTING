import { Clock } from 'lucide-react';

export default function OrderManagementPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Xem và cập nhật trạng thái đơn hàng của hệ thống.</p>
        </div>
      </div>

      <div 
        className="placeholder-panel" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '60px 24px', 
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          gap: '16px'
        }}
      >
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: '#fef3c7', 
            color: '#d97706', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Clock size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Chức năng đang phát triển
        </h3>
        <p style={{ maxWidth: '460px', color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
          Phần quản lý đơn hàng yêu cầu kết nối với API Backend để duyệt và cập nhật trạng thái giao hàng. Hiện tại tính năng này đang được phát triển và sẽ sớm ra mắt.
        </p>
      </div>
    </section>
  );
}
