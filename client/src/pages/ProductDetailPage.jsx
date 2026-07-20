import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { getProductById, getRecommendations, createProductReview, getSimilarProducts } from '../api/productApi';
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

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const navigate = useNavigate();
  const { showToast, showConfirm } = useNotification();
  const isLoggedIn = !!getStoredUser();

  useEffect(() => {
    async function loadProductDetail() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await getProductById(id);
        setProduct(response.data.product || null);
        window.scrollTo(0, 0); // Scroll to top on load
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
        const response = await getSimilarProducts(id);
        setRelatedProducts(response.data.items || []);
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm tương tự:', error);
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

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Vui lòng nhập nhận xét.', 'warning');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const response = await createProductReview(product._id, { rating, comment });
      showToast('Cảm ơn bạn đã gửi đánh giá!', 'success');
      setComment('');
      setRating(5);
      // Reload product details to show the new review
      const refreshed = await getProductById(id);
      setProduct(refreshed.data.product);
    } catch (error) {
      console.error('Lỗi gửi đánh giá:', error);
      const msg = error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReview(false);
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

  const productImage = product.images?.[0] || '/products/placeholder.svg';
  const hasDiscount = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container page">
      <div className="product-detail">
        <div className="detail-media">
          <img
            src={productImage}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = '/products/placeholder.svg';
            }}
          />
        </div>

        <section className="detail-content">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.2rem', color: '#eab308' }}>
              {'★'.repeat(Math.round(product.averageRating || 0)) + '☆'.repeat(5 - Math.round(product.averageRating || 0))}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              ({product.averageRating || 0} / 5, {product.reviews?.length || 0} đánh giá)
            </span>
          </div>
          
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

      {/* Reviews Section */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', marginTop: '48px', paddingTop: '32px' }}>
        <div className="section-heading">
          <p className="eyebrow">Đánh giá từ khách hàng</p>
          <h2>Nhận xét sản phẩm</h2>
        </div>

        <div className="reviews-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '24px' }}>
          {/* Reviews List */}
          <div>
            <h3 style={{ marginBottom: '16px' }}>Danh sách đánh giá ({product.reviews?.length || 0})</h3>
            {product.reviews && product.reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {product.reviews.map((rev, idx) => (
                  <div key={idx} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px' }}>{rev.customerName}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div style={{ color: '#eab308', marginBottom: '6px' }}>
                      {'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>
            )}
          </div>

          {/* Submit Review Form */}
          <div>
            <h3 style={{ marginBottom: '16px' }}>Viết đánh giá của bạn</h3>
            {isLoggedIn ? (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                    Chọn điểm đánh giá:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '24px',
                          color: star <= rating ? '#eab308' : '#ccc',
                          padding: 0,
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                    Nhận xét của bạn:
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="button primary"
                  disabled={isSubmittingReview}
                  style={{ alignSelf: 'flex-start', minHeight: '40px', padding: '0 24px' }}
                >
                  {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '24px', backgroundColor: 'var(--soft)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px', color: 'var(--ink)' }}>Vui lòng đăng nhập để gửi đánh giá sản phẩm.</p>
                <Link to="/login" className="button primary" style={{ display: 'inline-block' }}>
                  Đăng nhập ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Similar Products Section */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', marginTop: '64px', paddingTop: '48px' }}>
        <div className="section-heading">
          <p className="eyebrow">AI Recommendation</p>
          <h2>Sản phẩm tương tự</h2>
        </div>
        
        {isRelatedLoading ? (
          <div style={{ color: 'var(--muted)', padding: '20px 0' }}>Đang tìm kiếm sản phẩm tương tự bằng AI...</div>
        ) : (
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}

            {!isRelatedLoading && relatedProducts.length === 0 && (
              <div style={{ color: 'var(--muted)', gridColumn: 'span 3', padding: '20px 0' }}>
                Không tìm thấy sản phẩm tương tự nào có tên tương đồng trong hệ thống.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
