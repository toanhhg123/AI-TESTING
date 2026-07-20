import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="container page narrow-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--surface)', padding: '40px 24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <XCircle size={64} style={{ color: '#ef4444' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>
            Đã hủy thanh toán
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Giao dịch thanh toán trực tuyến qua Stripe của bạn đã bị hủy bỏ bởi người dùng hoặc hệ thống.
          </p>
          {orderId && (
            <div style={{ width: '100%', background: 'var(--background)', borderRadius: '12px', padding: '12px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--muted)', border: '1px dashed var(--border)' }}>
              Mã đơn hàng: {orderId}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '12px' }}>
            <Link to="/orders" className="button primary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} />
              <span>Thử thanh toán lại</span>
            </Link>
            <Link to="/" className="button secondary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} />
              <span>Quay lại Trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
