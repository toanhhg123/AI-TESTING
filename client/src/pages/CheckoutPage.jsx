import { CheckCircle, ShoppingBag, CreditCard, ChevronRight, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import { getCart } from '../api/cartApi';
import { createOrder } from '../api/orderApi';
import { getStoredUser } from '../utils/authStorage';

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');

  // Form states
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const currentUser = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    async function fetchCartData() {
      try {
        const response = await getCart();
        const cartData = response.data.cart;
        setCart(cartData);

        // Pre-fill receiverName from user profile
        if (currentUser.fullName) {
          setReceiverName(currentUser.fullName);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin giỏ hàng:', err);
        setError('Không thể lấy thông tin giỏ hàng.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCartData();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!receiverName.trim() || !phoneNumber.trim() || !shippingAddress.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await createOrder({
        receiverName,
        phoneNumber,
        shippingAddress,
        paymentMethod,
      });
      setCreatedOrder(response.data.order);
    } catch (err) {
      console.error('Lỗi khi thanh toán:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatPrice(amount) {
    return amount.toLocaleString('vi-VN') + ' ₫';
  }

  if (isLoading) {
    return (
      <div className="container page">
        <div className="empty-state">Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  // If order was successfully created, render success state
  if (createdOrder) {
    return (
      <div className="container page">
        <div className="success-screen">
          <div className="success-icon-container">
            <CheckCircle size={40} />
          </div>
          <h2 className="success-title">Đặt hàng thành công!</h2>
          <p className="success-message">
            Cảm ơn bạn đã mua sắm tại Mobile Store. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.
          </p>

          <div className="success-details">
            <div className="success-details-row">
              <span className="success-details-label">Mã đơn hàng</span>
              <span className="success-details-value" style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent)' }}>
                #DH-{createdOrder._id.toUpperCase()}
              </span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Người nhận</span>
              <span className="success-details-value">{createdOrder.receiverName}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Số điện thoại</span>
              <span className="success-details-value">{createdOrder.phoneNumber}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Tổng thanh toán</span>
              <span className="success-details-value" style={{ color: 'var(--accent)', fontWeight: '700' }}>
                {formatPrice(createdOrder.totalAmount)}
              </span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Phương thức</span>
              <span className="success-details-value">
                {createdOrder.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản ngân hàng'}
              </span>
            </div>
          </div>

          <div className="success-actions">
            <Link className="checkout-btn" to="/orders" style={{ textDecoration: 'none', margin: 0 }}>
              Xem đơn hàng của tôi
            </Link>
            <Link
              className="checkout-btn"
              to="/products"
              style={{
                textDecoration: 'none',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                boxShadow: 'none',
                margin: 0,
              }}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="container page">
        <PageHeader
          eyebrow="Thanh toán"
          title="Hoàn tất đơn hàng"
          description="Giỏ hàng của bạn đang trống."
        />
        <div className="success-screen" style={{ marginTop: '24px' }}>
          <div className="success-icon-container" style={{ background: '#f8fafc', color: '#64748b' }}>
            <ShoppingBag size={36} />
          </div>
          <h2 className="success-title">Giỏ hàng trống</h2>
          <p className="success-message">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.
          </p>
          <div className="success-actions">
            <Link className="checkout-btn" to="/products" style={{ textDecoration: 'none' }}>
              Quay lại danh mục sản phẩm <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const p = item.product;
    if (!p) return sum;
    const finalPrice = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  const shippingFee = subtotal > 15000000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Thanh toán"
        title="Thông tin đơn hàng"
        description="Điền thông tin nhận hàng và chọn phương thức thanh toán để hoàn tất đơn hàng."
      />

      <div style={{ marginBottom: '20px' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      <form className="checkout-layout" onSubmit={handleSubmit}>
        {/* Left Column: Form Info */}
        <div className="checkout-form-container">
          <div className="form-card">
            <h3 className="form-section-title">
              <CreditCard size={18} /> Thông tin giao hàng
            </h3>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="receiverName">Họ và tên người nhận</label>
              <input
                id="receiverName"
                type="text"
                placeholder="Nhập đầy đủ họ tên"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="phoneNumber">Số điện thoại nhận hàng</label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="Nhập số điện thoại liên hệ"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="shippingAddress">Địa chỉ nhận hàng (Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP)</label>
              <textarea
                id="shippingAddress"
                rows="3"
                placeholder="Ví dụ: 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <h3 className="form-section-title" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '8px' }}>
              Phương thức thanh toán
            </h3>

            <div className="payment-methods-grid">
              <div
                className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span className="payment-method-title">Thanh toán COD</span>
                </div>
                <p className="payment-method-desc">Thanh toán bằng tiền mặt khi nhận hàng.</p>
              </div>

              <div
                className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span className="payment-method-title">Chuyển khoản</span>
                </div>
                <p className="payment-method-desc">Chuyển khoản trực tiếp qua ngân hàng hoặc ví điện tử.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Info */}
        <div className="summary-card">
          <h3 className="summary-title">Tóm tắt đơn hàng</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((item) => {
              const p = item.product;
              if (!p) return null;

              const hasSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
              const finalPrice = hasSale ? p.salePrice : p.price;

              return (
                <div key={p._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                    alt={p.name}
                    style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)', background: 'var(--background)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Số lượng: {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)', flexShrink: 0 }}>
                    {formatPrice(finalPrice * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
          </div>
          <div className="summary-row total">
            <span>Tổng cộng</span>
            <span className="total-price">{formatPrice(total)}</span>
          </div>

          <button
            className="place-order-btn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng ngay'}
          </button>
        </div>
      </form>
    </div>
  );
}
