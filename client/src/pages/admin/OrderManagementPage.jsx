import { Search, Eye, Check, Truck, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X, User, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAdminOrders, updateAdminOrderStatus } from '../../api/adminApi';
import { useNotification } from '../../components/NotificationProvider.jsx';

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
  });

  const [searchInput, setSearchInput] = useState('');

  const { showToast, showConfirm } = useNotification();

  async function loadOrders(pageNumber = 1) {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: pageNumber,
        limit: 10,
      };
      if (filters.status) params.status = filters.status;
      if (filters.keyword) params.keyword = filters.keyword;

      const response = await getAdminOrders(params);
      setOrders(response.data.items || []);
      setPagination(response.data.pagination || {
        page: pageNumber,
        limit: 10,
        total: 0,
        totalPages: 1,
      });
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
      setError('Không thể lấy danh sách đơn hàng từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(1);
  }, [filters]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, keyword: searchInput }));
  }

  function handleStatusFilterChange(e) {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  }

  function handleReset() {
    setSearchInput('');
    setFilters({ keyword: '', status: '' });
  }

  async function handleStatusUpdate(orderId, newStatus) {
    const statusLabels = {
      confirmed: 'Xác nhận đơn hàng',
      shipping: 'Bắt đầu giao hàng',
      completed: 'Hoàn thành giao hàng',
      cancelled: 'Hủy đơn hàng',
    };

    const isConfirmed = await showConfirm(
      'Cập nhật đơn hàng',
      `Bạn có chắc chắn muốn chuyển trạng thái đơn sang "${statusLabels[newStatus] || newStatus}"?`
    );

    if (!isConfirmed) return;

    setIsUpdating(true);
    try {
      const response = await updateAdminOrderStatus(orderId, newStatus);
      showToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
      
      // Update selectedOrder if open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(response.data.order);
      }

      // Refresh list
      loadOrders(pagination.page);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  function getStatusLabel(status) {
    const statuses = {
      pending: 'Chờ duyệt',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
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
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Duyệt, vận chuyển và theo dõi tất cả đơn hàng trong hệ thống.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="admin-filter-bar" style={{ gap: '12px', alignItems: 'center' }}>
        <form className="admin-search-form" onSubmit={handleSearchSubmit}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Tên, SĐT nhận..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <select
          className="admin-select"
          value={filters.status}
          onChange={handleStatusFilterChange}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        {(filters.keyword || filters.status || searchInput) && (
          <button
            className="button secondary"
            type="button"
            onClick={handleReset}
            style={{ minHeight: '40px', padding: '0 16px', borderRadius: '10px' }}
          >
            Đặt lại
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {isLoading ? (
        <div className="empty-state">Đang tải danh sách đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">Không tìm thấy đơn hàng nào phù hợp.</div>
      ) : (
        <>
          <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Người nhận / SĐT</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                        #DH-{order._id.substring(order._id.length - 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--ink)' }}>{order.receiverName}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{order.phoneNumber}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td>
                      <span className={`order-status-badge status-${order.status}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          title="Xem chi tiết"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {order.status === 'pending' && (
                          <>
                            <button
                              className="icon-button"
                              type="button"
                              onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                              title="Xác nhận đơn"
                              style={{ border: '1px solid #10b981', color: '#10b981', background: '#ecfdf5' }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="icon-button"
                              type="button"
                              onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                              title="Hủy đơn"
                              style={{ border: '1px solid #ef4444', color: '#ef4444', background: '#fef2f2' }}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        {order.status === 'confirmed' && (
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleStatusUpdate(order._id, 'shipping')}
                            title="Giao vận hàng"
                            style={{ border: '1px solid #3b82f6', color: '#3b82f6', background: '#eff6ff' }}
                          >
                            <Truck size={16} />
                          </button>
                        )}

                        {order.status === 'shipping' && (
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleStatusUpdate(order._id, 'completed')}
                            title="Hoàn thành giao"
                            style={{ border: '1px solid #10b981', color: '#10b981', background: '#ecfdf5' }}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                Hiển thị {orders.length} / {pagination.total} đơn hàng
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadOrders(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  style={{ border: '1px solid var(--border)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadOrders(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{ border: '1px solid var(--border)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Overlay Modal Dialog */}
      {selectedOrder && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '680px', width: 'calc(100% - 32px)', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Chi tiết đơn hàng #DH-{selectedOrder._id.toUpperCase()}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Thời gian đặt: {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Delivery address details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '16px',
                background: 'var(--background)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} style={{ color: 'var(--muted)' }} />
                  <strong>Người nhận:</strong> {selectedOrder.receiverName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} style={{ color: 'var(--muted)' }} />
                  <strong>Số điện thoại:</strong> {selectedOrder.phoneNumber}
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--muted)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                <div>
                  <strong>Trạng thái:</strong>{' '}
                  <span className={`order-status-badge status-${selectedOrder.status}`} style={{ display: 'inline-block', marginTop: '2px' }}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <strong>Hình thức:</strong> {selectedOrder.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản'}
                </div>
                {selectedOrder.customer && (
                  <div>
                    <strong>Tài khoản đặt:</strong> {selectedOrder.customer.fullName} ({selectedOrder.customer.email})
                  </div>
                )}
              </div>
            </div>

            {/* List of items */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Danh sách sản phẩm</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', marginBottom: '20px' }}>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <img
                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                    alt={item.product?.name || 'Sản phẩm'}
                    style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)', background: 'var(--background)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product?.name || 'Sản phẩm đã gỡ bỏ'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Thương hiệu: {item.product?.brand || 'Không xác định'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{formatPrice(item.price)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Số lượng: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng thanh toán đơn hàng:</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>{formatPrice(selectedOrder.totalAmount)}</strong>
            </div>

            {/* Actions list */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                className="button secondary"
                type="button"
                onClick={() => setSelectedOrder(null)}
                disabled={isUpdating}
                style={{ borderRadius: '10px' }}
              >
                Đóng
              </button>

              {selectedOrder.status === 'pending' && (
                <>
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                    disabled={isUpdating}
                    style={{ borderRadius: '10px', background: '#ef4444', color: 'white' }}
                  >
                    Hủy đơn hàng
                  </button>
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'confirmed')}
                    disabled={isUpdating}
                    style={{ borderRadius: '10px' }}
                  >
                    Xác nhận đơn
                  </button>
                </>
              )}

              {selectedOrder.status === 'confirmed' && (
                <button
                  className="button primary"
                  type="button"
                  onClick={() => handleStatusUpdate(selectedOrder._id, 'shipping')}
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Bàn giao vận chuyển
                </button>
              )}

              {selectedOrder.status === 'shipping' && (
                <button
                  className="button primary"
                  type="button"
                  onClick={() => handleStatusUpdate(selectedOrder._id, 'completed')}
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Xác nhận đã hoàn thành giao
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
