import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const productImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
  
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

  return (
    <article className="product-card">
      <Link className="product-media" to={`/products/${productId}`} aria-label={product.name}>
        <img src={productImage} alt={product.name} />
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
          <button className="icon-button dark" type="button" aria-label="Thêm vào giỏ hàng">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
