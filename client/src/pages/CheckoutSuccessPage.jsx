import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';

import { verifyStripePayment } from '../api/orderApi';
import { useNotification } from '../components/NotificationProvider.jsx';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [errorMessage, setErrorMessage] = useState('');
  const { showToast } = useNotification();

  useEffect(() => {
    if (!orderId || !sessionId) {
      setStatus('failed');
      setErrorMessage('Thông tin thanh toán không hợp lệ (Thiếu mã đơn hàng hoặc mã phiên).');
      return;
    }

    async function verifyPayment() {
      try {
        const response = await verifyStripePayment(orderId, sessionId);
        setStatus('success');
        showToast(response.data.message || 'Thanh toán thành công!', 'success');
        
        // Dispatch event to notify Cart Component that checkout completed and cart needs refresh
        window.dispatchEvent(new Event('cart-updated'));
      } catch (err) {
        console.error('Lỗi xác thực thanh toán:', err);
        setStatus('failed');
        setErrorMessage(err.response?.data?.message || 'Không thể xác thực trạng thái thanh toán từ Stripe.');
      }
    }

    verifyPayment();
  }, [orderId, sessionId]);

  return (
    <div className="container page narrow-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--surface)', padding: '40px 24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        {status === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              Đang xác thực thanh toán...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Vui lòng giữ nguyên trình duyệt, hệ thống đang kiểm tra trạng thái thanh toán từ Stripe.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <CheckCircle size={64} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>
              Thanh toán thành công!
            </h2>
            <p style={{ color: '#10b981', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
              Đơn hàng của bạn đã được thanh toán qua Stripe.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
              Cảm ơn bạn đã mua sắm tại Mobile Store. Đơn hàng của bạn đang được chuyển trạng thái xử lý và chuẩn bị đóng gói.
            </p>
            <div style={{ width: '100%', background: 'var(--background)', borderRadius: '12px', padding: '12px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--muted)', border: '1px dashed var(--border)' }}>
              Mã đơn hàng: {orderId}<br />
              Mã phiên giao dịch: {sessionId.substring(0, 24)}...
            </div>
            
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
              <Link to="/orders" className="button secondary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                Đơn hàng của tôi
              </Link>
              <Link to="/" className="button primary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <AlertTriangle size={64} style={{ color: '#ef4444' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
              Thanh toán thất bại!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
              {errorMessage}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              Nếu tiền của bạn đã bị trừ nhưng đơn hàng chưa được xác nhận, vui lòng liên hệ bộ phận hỗ trợ khách hàng để được xử lý.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '12px' }}>
              <Link to="/orders" className="button primary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>
                Thử thanh toán lại
              </Link>
              <Link to="/" className="button secondary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
