import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link className="product-media" to={`/products/${product.id}`} aria-label={product.name}>
        <img src={product.image} alt={product.name} />
      </Link>

      <div className="product-body">
        <p className="product-brand">{product.brand}</p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-spec">{product.spec}</p>
        <div className="product-footer">
          <strong>{product.price}</strong>
          <button className="icon-button dark" type="button" aria-label="Thêm vào giỏ hàng">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
