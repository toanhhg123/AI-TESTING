import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { addCartItem } from '../api/cartApi';
import { getStoredUser } from '../utils/authStorage';
import { useNotification } from './NotificationProvider.jsx';

function formatCurrency(value) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value;
}

export default function ProductCard({ product }) {
  const productId = product._id || product.id;
  const productImage = product.images?.[0] || product.image || '/products/placeholder.svg';
  const [isAdding, setIsAdding] = useState(false);

  const { showToast, showConfirm } = useNotification();
  const navigate = useNavigate();
  
  // Format specifications text
  let specText = product.spec || '';
  if (product.specifications && typeof product.specifications === 'object') {
    const specs = [];
    if (product.specifications.chip) specs.push(product.specifications.chip);
    if (product.specifications.ram) specs.push(`RAM ${product.specifications.ram}`);
    if (product.specifications.storage) specs.push(`Bộ nhớ ${product.specifications.storage}`);
    if (specs.length > 0) {
      specText = specs.join(', ');
    } else if (product.description) {
      specText = product.description.slice(0, 60) + '...';
    }
  }

  const hasDiscount = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;

  async function handleAddCartClick(e) {
    e.stopPropagation();
    e.preventDefault();

    const user = getStoredUser();
    if (!user) {
      showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'warning');
      navigate('/login');
      return;
    }

    if (product.stock <= 0) {
      showToast('Sản phẩm hiện đã hết hàng.', 'warning');
      return;
    }

    setIsAdding(true);
    try {
      await addCartItem({ productId, quantity: 1 });
      showToast(`Đã thêm ${product.name} vào giỏ hàng thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khi thêm giỏ hàng:', err);
      const msg = err.response?.data?.message || 'Thêm sản phẩm vào giỏ hàng thất bại.';
      showToast(msg, 'error');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <article className="product-card">
      <Link className="product-media" to={`/products/${productId}`} aria-label={product.name}>
        <img
          src={productImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/products/placeholder.svg';
          }}
        />
      </Link>

      <div className="product-body">
        <p className="product-brand">{product.brand}</p>
        <h3>
          <Link to={`/products/${productId}`}>{product.name}</Link>
        </h3>
        <p className="product-spec" title={specText}>{specText}</p>
        <div className="product-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <strong style={{ color: 'var(--accent-dark)', fontSize: '1.1rem' }}>
              {formatCurrency(hasDiscount ? product.salePrice : product.price)}
            </strong>
            {hasDiscount && (
              <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '0.82rem' }}>
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <button
            className="card-add-btn"
            type="button"
            aria-label="Thêm vào giỏ hàng"
            onClick={handleAddCartClick}
            disabled={isAdding || product.stock <= 0}
          >
            <ShoppingCart size={15} />
            <span>{product.stock <= 0 ? 'Hết hàng' : 'Thêm'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
