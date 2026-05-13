import { SlidersHorizontal } from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { mockProducts } from '../data/mockProducts.js';

export default function ProductListPage() {
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Catalog"
        title="Danh sách sản phẩm"
        description="Trang nền để sau này gắn API lọc theo thương hiệu, giá, RAM, bộ nhớ và tìm kiếm thông minh."
      />

      <div className="catalog-layout">
        <aside className="filter-panel">
          <div className="panel-title">
            <SlidersHorizontal size={18} />
            <span>Bộ lọc</span>
          </div>
          <label>
            Thương hiệu
            <select>
              <option>Tất cả</option>
              <option>Apple</option>
              <option>Samsung</option>
              <option>Xiaomi</option>
            </select>
          </label>
          <label>
            Khoảng giá
            <select>
              <option>Tất cả</option>
              <option>Dưới 5 triệu</option>
              <option>5 - 15 triệu</option>
              <option>Trên 15 triệu</option>
            </select>
          </label>
        </aside>

        <div className="product-grid">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
