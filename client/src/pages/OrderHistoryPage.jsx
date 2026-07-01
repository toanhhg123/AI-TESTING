import { Calendar, ClipboardList, MapPin, Search, ShieldCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import { getOrders, lookupOrder } from '../api/orderApi';
import { getStoredUser } from '../utils/authStorage';

export default function OrderHistoryPage() {
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'lookup'
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Logged-in orders history
  const [orders, setOrders] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');

  // Anonymous order lookup state
  const [lookupId, setLookupId] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      if (!currentUser) {
        setIsLoadingHistory(false);
        return;
      }

      async function fetchOrders() {
        setIsLoadingHistory(true);
        try {
          const response = await getOrders();
          setOrders(response.data.orders || []);
        } catch (err) {
          console.error('Lỗi khi tải lịch sử đơn hàng:', err);
          setHistoryError('Không thể lấy danh sách đơn hàng từ hệ thống.');
        } finally {
          setIsLoadingHistory(false);
        }
      }

      fetchOrders();
    }
  }, [activeTab, currentUser]);

  async function handleLookup(e) {
    e.preventDefault();
    if (!lookupId.trim() || !lookupPhone.trim()) {
      setLookupError('Vui lòng cung cấp mã đơn hàng và số điện thoại giao hàng.');
      return;
    }

    setLookupError('');
    setLookupResult(null);
    setIsLookingUp(true);

    try {
      const response = await lookupOrder(lookupId, lookupPhone);
      setLookupResult(response.data.order);
    } catch (err) {
      console.error('Lỗi tra cứu đơn hàng:', err);
      const msg = err.response?.data?.message || 'Không tìm thấy đơn hàng phù hợp với thông tin đã nhập.';
      setLookupError(msg);
    } finally {
      setIsLookingUp(false);
    }
  }

  function getStatusLabel(status) {
    const statuses = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao hàng',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statuses[status] || status;
  }

  function formatPrice(amount) {
    return amount ? amount.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Đơn hàng"
        title="Quản lý đơn hàng"
        description="Theo dõi trạng thái giao nhận và lịch sử mua sắm thiết bị di động."
      />

      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('history')}
          >
            <ClipboardList size={18} /> Lịch sử đơn hàng
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'lookup' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('lookup')}
          >
            <Search size={18} /> Tra cứu nhanh
          </button>
        </div>

        {/* Tab Content 1: History */}
        {activeTab === 'history' && (
          <div className="tab-pane">
            {!currentUser ? (
              <div className="success-screen" style={{ marginTop: '0', padding: '30px' }}>
                <div className="success-icon-container" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <User size={32} />
                </div>
                <h2 className="success-title">Bạn chưa đăng nhập</h2>
                <p className="success-message">
                  Hãy đăng nhập để lưu trữ và xem toàn bộ lịch sử đơn hàng cá nhân của mình.
                </p>
                <div className="success-actions">
                  <Link className="checkout-btn" to="/login" style={{ textDecoration: 'none', margin: '0 auto' }}>
                    Đăng nhập tài khoản
                  </Link>
                </div>
              </div>
            ) : isLoadingHistory ? (
              <div className="empty-state">Đang tải lịch sử mua hàng...</div>
            ) : historyError ? (
              <div className="alert alert-error">{historyError}</div>
            ) : orders.length === 0 ? (
              <div className="success-screen" style={{ marginTop: '0', padding: '30px' }}>
                <div className="success-icon-container" style={{ background: '#f8fafc', color: '#64748b' }}>
                  <ClipboardList size={32} />
                </div>
                <h2 className="success-title">Chưa có đơn hàng nào</h2>
                <p className="success-message">
                  Mọi đơn hàng bạn mua sẽ xuất hiện tại đây để tiện theo dõi.
                </p>
                <div className="success-actions">
                  <Link className="checkout-btn" to="/products" style={{ textDecoration: 'none', margin: '0 auto' }}>
                    Mua sắm ngay
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-card-header">
                      <div className="order-meta">
                        <span className="order-id">Mã đơn: #DH-{order._id.toUpperCase()}</span>
                        <span className="order-date">Đặt ngày: {formatDate(order.createdAt)}</span>
                      </div>
                      <span className={`order-status-badge status-${order.status}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="order-card-items">
                      {order.items.map((item, idx) => {
                        const p = item.product;
                        return (
                          <div key={idx} className="order-card-item">
                            <img
                              className="order-item-mini-thumb"
                              src={p?.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                              alt={p?.name || 'Sản phẩm'}
                            />
                            <div className="order-item-mini-info">
                              <span className="order-item-mini-name">{p?.name || 'Sản phẩm đã gỡ bỏ'}</span>
                              <span className="order-item-mini-qty">
                                Số lượng: {item.quantity} × {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="order-card-footer">
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Thanh toán: {order.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản'}
                      </span>
                      <span className="order-total-amount">
                        Tổng tiền: {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Quick Lookup */}
        {activeTab === 'lookup' && (
          <div className="tab-pane">
            <div className="lookup-form-container">
              <form onSubmit={handleLookup}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="lookupId">Mã đơn hàng</label>
                  <input
                    id="lookupId"
                    type="text"
                    placeholder="Ví dụ: 64a85fa..."
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="lookupPhone">Số điện thoại mua hàng</label>
                  <input
                    id="lookupPhone"
                    type="tel"
                    placeholder="Nhập số điện thoại nhận hàng"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    required
                  />
                </div>

                <button className="lookup-btn" type="submit" disabled={isLookingUp}>
                  {isLookingUp ? 'Đang kiểm tra...' : 'Tra cứu đơn hàng'}
                </button>
              </form>
            </div>

            {lookupError && (
              <div className="alert alert-error" style={{ maxWidth: '480px', margin: '20px auto 0 auto' }}>
                {lookupError}
              </div>
            )}

            {/* Display Lookup Results */}
            {lookupResult && (
              <div className="lookup-results-wrapper" style={{ maxWidth: '640px', margin: '32px auto 0 auto' }}>
                <div className="order-card" style={{ borderColor: 'var(--accent)' }}>
                  <div className="order-card-header">
                    <div className="order-meta">
                      <span className="order-id" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
                        Kết quả tra cứu đơn hàng: #DH-{lookupResult._id.toUpperCase()}
                      </span>
                      <span className="order-date">
                        Thời gian tạo: {formatDate(lookupResult.createdAt)}
                      </span>
                    </div>
                    <span className={`order-status-badge status-${lookupResult.status}`}>
                      {getStatusLabel(lookupResult.status)}
                    </span>
                  </div>

                  {/* Delivery details inside lookup */}
                  <div
                    style={{
                      background: 'var(--background)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                      <User size={16} style={{ color: 'var(--text-muted)' }} />
                      <strong>Người nhận:</strong> {lookupResult.receiverName} ({lookupResult.phoneNumber})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '8px', color: 'var(--text)' }}>
                      <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Địa chỉ giao:</strong> {lookupResult.shippingAddress}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                      <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                      <strong>Thanh toán:</strong>{' '}
                      {lookupResult.paymentMethod === 'cod' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                    </div>
                  </div>

                  <div className="order-card-items">
                    {lookupResult.items.map((item, idx) => {
                      const p = item.product;
                      return (
                        <div key={idx} className="order-card-item">
                          <img
                            className="order-item-mini-thumb"
                            src={p?.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                            alt={p?.name || 'Sản phẩm'}
                          />
                          <div className="order-item-mini-info">
                            <span className="order-item-mini-name">{p?.name || 'Sản phẩm đã gỡ bỏ'}</span>
                            <span className="order-item-mini-qty">
                              Số lượng: {item.quantity} × {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="order-card-footer">
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Cập nhật mới nhất: {formatDate(lookupResult.updatedAt)}
                    </span>
                    <span className="order-total-amount" style={{ fontSize: '1.2rem' }}>
                      Tổng tiền: {formatPrice(lookupResult.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
