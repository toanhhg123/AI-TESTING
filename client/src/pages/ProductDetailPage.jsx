import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { getProductById, getRecommendations } from '../api/productApi';
import { addCartItem } from '../api/cartApi';
import { getStoredUser } from '../utils/authStorage';
import ProductCard from '../components/ProductCard.jsx';
import { useNotification } from '../components/NotificationProvider.jsx';

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const navigate = useNavigate();
  const { showToast, showConfirm } = useNotification();

  useEffect(() => {
    async function loadProductDetail() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await getProductById(id);
        setProduct(response.data.product || null);
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        setErrorMessage(error.response?.data?.message || 'Không thể tải chi tiết sản phẩm này.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProductDetail();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function loadRelatedProducts() {
      setIsRelatedLoading(true);
      try {
        const response = await getRecommendations({ productId: id, limit: 3 });
        setRelatedProducts(response.data.items || []);
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm liên quan:', error);
      } finally {
        setIsRelatedLoading(false);
      }
    }
    loadRelatedProducts();
  }, [id]);

  async function handleAddToCart() {
    const user = getStoredUser();
    if (!user) {
      showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'warning');
      navigate('/login');
      return;
    }

    setIsAdding(true);
    try {
      await addCartItem({ productId: product._id, quantity: 1 });
      showToast(`Đã thêm ${product.name} vào giỏ hàng thành công!`, 'success');
    } catch (error) {
      console.error('Lỗi thêm giỏ hàng:', error);
      const msg = error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.';
      showToast(msg, 'error');
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--muted)' }}>
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p className="form-message error" style={{ display: 'inline-block', margin: '0 0 20px' }}>
          {errorMessage || 'Không tìm thấy sản phẩm.'}
        </p>
        <div>
          <Link className="button primary" to="/products">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const productImage = product.images?.[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
  const hasDiscount = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container page">
      <div className="product-detail">
        <div className="detail-media">
          <img src={productImage} alt={product.name} />
        </div>

        <section className="detail-content">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '14px 0' }}>
            <strong className="detail-price" style={{ margin: 0, color: 'var(--accent-dark)', fontSize: '2.2rem' }}>
              {formatCurrency(hasDiscount ? product.salePrice : product.price)}
            </strong>
            {hasDiscount && (
              <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '1.25rem' }}>
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <p style={{ color: 'var(--ink)', lineHeight: 1.7, marginBottom: '24px' }}>
            {product.description || 'Chưa có mô tả cho sản phẩm này.'}
          </p>

          <button
            className="button primary"
            type="button"
            style={{ width: '100%', maxWidth: '280px', minHeight: '48px' }}
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
          >
            <ShoppingCart size={18} />
            {isOutOfStock ? 'Hết hàng' : isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>

          {product.specifications && Object.keys(product.specifications).length > 0 ? (
            <div className="spec-table" style={{ marginTop: '32px' }}>
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key}>
                  <span style={{ textTransform: 'capitalize', color: 'var(--muted)', fontWeight: 600 }}>{key}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {/* Related Products Section */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', marginTop: '64px', paddingTop: '48px' }}>
        <div className="section-heading">
          <p className="eyebrow">Gợi ý dành cho bạn</p>
          <h2>Sản phẩm liên quan</h2>
        </div>
        
        {isRelatedLoading ? (
          <div style={{ color: 'var(--muted)', padding: '20px 0' }}>Đang tải sản phẩm liên quan...</div>
        ) : (
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}

            {!isRelatedLoading && relatedProducts.length === 0 && (
              <div style={{ color: 'var(--muted)', gridColumn: 'span 3', padding: '20px 0' }}>
                Không có sản phẩm liên quan nào phù hợp.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
