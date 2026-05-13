import { ShoppingCart } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { mockProducts } from '../data/mockProducts.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = mockProducts.find((item) => item.id === id) || mockProducts[0];

  return (
    <div className="container page product-detail">
      <div className="detail-media">
        <img src={product.image} alt={product.name} />
      </div>

      <section className="detail-content">
        <p className="eyebrow">{product.brand}</p>
        <h1>{product.name}</h1>
        <p>{product.spec}</p>
        <strong className="detail-price">{product.price}</strong>
        <button className="button primary" type="button">
          <ShoppingCart size={18} />
          Thêm vào giỏ hàng
        </button>

        <div className="spec-table">
          <div>
            <span>Màn hình</span>
            <strong>6.1 - 6.7 inch</strong>
          </div>
          <div>
            <span>Bộ nhớ</span>
            <strong>128GB / 256GB</strong>
          </div>
          <div>
            <span>Bảo hành</span>
            <strong>12 tháng</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
