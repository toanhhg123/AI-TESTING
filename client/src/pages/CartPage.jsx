import { ArrowRight, Lock, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import { getCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { getStoredUser } from '../utils/authStorage';
import { useNotification } from '../components/NotificationProvider.jsx';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const navigate = useNavigate();

  const { showToast, showConfirm } = useNotification();

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    async function fetchCartData() {
      try {
        const response = await getCart();
        setCart(response.data.cart);
      } catch (err) {
        console.error('Lỗi khi tải giỏ hàng:', err);
        setError('Không thể kết nối máy chủ để tải giỏ hàng.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCartData();
  }, [currentUser]);

  async function handleQtyChange(productId, currentQty, delta, stock) {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > stock) {
      showToast(`Sản phẩm này chỉ còn ${stock} máy trong kho.`, 'warning');
      return;
    }

    try {
      const response = await updateCartItem(productId, { quantity: newQty });
      setCart(response.data.cart);
    } catch (err) {
      console.error('Lỗi khi cập nhật số lượng:', err);
      const msg = err.response?.data?.message || 'Cập nhật số lượng thất bại.';
      showToast(msg, 'error');
    }
  }

  async function handleRemove(productId) {
    const confirmed = await showConfirm(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?'
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await removeCartItem(productId);
      setCart(response.data.cart);
      showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      showToast('Không thể xóa sản phẩm khỏi giỏ hàng.', 'error');
    }
  }

  function formatPrice(amount) {
    return amount.toLocaleString('vi-VN') + ' ₫';
  }

  if (!currentUser) {
    return (
      <div className="container page">
        <PageHeader
          eyebrow="Giỏ hàng"
          title="Giỏ hàng của bạn"
          description="Vui lòng đăng nhập để bắt đầu thêm và mua sắm sản phẩm."
        />
        <div className="success-screen" style={{ marginTop: '24px' }}>
          <div className="success-icon-container" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <Lock size={36} />
          </div>
          <h2 className="success-title">Yêu cầu đăng nhập</h2>
          <p className="success-message">
            Chúng tôi lưu giỏ hàng của bạn trên tài khoản để bạn có thể xem lại trên mọi thiết bị.
          </p>
          <div className="success-actions">
            <Link className="checkout-btn" to="/login" style={{ textDecoration: 'none' }}>
              Đăng nhập ngay <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container page">
        <div className="empty-state">Đang tải giỏ hàng...</div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const p = item.product;
    if (!p) return sum;
    const finalPrice = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  // Free shipping for orders above 15,000,000 VND, otherwise 30,000 VND
  const shippingFee = subtotal > 15000000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Giỏ hàng"
        title="Sản phẩm đã chọn"
        description="Quản lý các mặt hàng và chuẩn bị thanh toán đơn đặt hàng của bạn."
      />

      {error && <div className="alert alert-error">{error}</div>}

      {items.length === 0 ? (
        <div className="success-screen" style={{ marginTop: '24px' }}>
          <div className="success-icon-container" style={{ background: '#f8fafc', color: '#64748b' }}>
            <ShoppingBag size={36} />
          </div>
          <h2 className="success-title">Giỏ hàng trống</h2>
          <p className="success-message">
            Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá ngay các mẫu điện thoại mới nhất.
          </p>
          <div className="success-actions">
            <Link className="checkout-btn" to="/products" style={{ textDecoration: 'none' }}>
              Khám phá sản phẩm <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Left Column: Items */}
          <div className="cart-items-container">
            {items.map((item) => {
              const p = item.product;
              if (!p) return null;

              const hasSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
              const finalPrice = hasSale ? p.salePrice : p.price;

              return (
                <div key={p._id} className="cart-item-card">
                  <img
                    className="cart-item-thumb"
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                    alt={p.name}
                  />

                  <div className="cart-item-info">
                    <span className="cart-item-brand">{p.brand}</span>
                    <Link className="cart-item-name" to={`/products/${p._id}`}>
                      {p.name}
                    </Link>
                    <div className="cart-item-prices">
                      <span className="cart-item-price">{formatPrice(finalPrice)}</span>
                      {hasSale && (
                        <span className="cart-item-original-price">{formatPrice(p.price)}</span>
                      )}
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        type="button"
                        onClick={() => handleQtyChange(p._id, item.quantity, -1, p.stock)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        className="quantity-input"
                        type="number"
                        value={item.quantity}
                        readOnly
                      />
                      <button
                        className="quantity-btn"
                        type="button"
                        onClick={() => handleQtyChange(p._id, item.quantity, 1, p.stock)}
                        disabled={item.quantity >= p.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      className="cart-remove-btn"
                      type="button"
                      onClick={() => handleRemove(p._id)}
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Price Summary */}
          <div className="summary-card">
            <h3 className="summary-title">Tóm tắt đơn hàng</h3>
            <div className="summary-row">
              <span>Tạm tính ({items.length} sản phẩm)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="summary-row" style={{ fontSize: '0.8rem', color: '#10b981' }}>
                <span>* Miễn phí ship cho đơn từ 15M đ</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Tổng cộng</span>
              <span className="total-price">{formatPrice(total)}</span>
            </div>

            <button
              className="checkout-btn"
              type="button"
              onClick={() => navigate('/checkout')}
            >
              Tiến hành thanh toán <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
