import { Bot, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { mockProducts } from '../data/mockProducts.js';

const features = [
  { icon: Search, title: 'Tìm kiếm thông minh', text: 'Lọc theo thương hiệu, giá và cấu hình.' },
  { icon: Bot, title: 'Chatbot tư vấn', text: 'Mô phỏng tư vấn sản phẩm theo ngân sách.' },
  { icon: Sparkles, title: 'Gợi ý sản phẩm', text: 'Đề xuất theo thương hiệu và tầm giá.' },
  { icon: ShieldCheck, title: 'Quản trị rõ ràng', text: 'Theo dõi sản phẩm, đơn hàng và tồn kho.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Đồ án tốt nghiệp</p>
            <h1>Mobile Store</h1>
            <p>
              Website bán thiết bị di động với luồng mua hàng, quản trị đơn hàng và các module AI
              mô phỏng phục vụ demo học thuật.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/products">
                Xem sản phẩm
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <p className="eyebrow">Chức năng chính</p>
          <h2>Nền tảng cho website thương mại điện tử</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="feature-item" key={feature.title}>
                <Icon size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading inline">
          <div>
            <p className="eyebrow">Sản phẩm mẫu</p>
            <h2>Thiết bị nổi bật</h2>
          </div>
          <Link className="text-link" to="/products">
            Xem tất cả
          </Link>
        </div>

        <div className="product-grid">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
