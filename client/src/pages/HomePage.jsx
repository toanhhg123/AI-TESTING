import { Bot, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../api/productApi";
import ProductCard from "../components/ProductCard.jsx";

const features = [
  {
    icon: Search,
    title: "Tìm kiếm thông minh",
    text: "Lọc theo thương hiệu, giá và cấu hình.",
  },
  {
    icon: Bot,
    title: "Chatbot tư vấn",
    text: "Mô phỏng tư vấn sản phẩm theo ngân sách.",
  },
  {
    icon: Sparkles,
    title: "Gợi ý sản phẩm",
    text: "Đề xuất theo thương hiệu và tầm giá.",
  },
  {
    icon: ShieldCheck,
    title: "Quản trị rõ ràng",
    text: "Theo dõi sản phẩm, đơn hàng và tồn kho.",
  },
];

const fallbackImage = "/products/placeholder.svg";

function formatCurrency(value) {
  if (typeof value !== "number") return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildTagline(product) {
  const specs = product.specifications || {};
  const parts = [];
  if (specs.chip) parts.push(specs.chip);
  if (specs.ram) parts.push(`RAM ${specs.ram}`);
  if (specs.storage) parts.push(specs.storage);
  if (parts.length > 0) return parts.join(" · ");
  if (product.description) return product.description.slice(0, 80);
  return "Trải nghiệm hiệu năng vượt trội trong một thiết kế tinh tế.";
}

function ProductTile({ product, dark }) {
  const productId = product._id || product.id;
  // Hardcode ảnh tile về render iPhone 17 Pro trong public
  const image = '/ip_17pro.png';
  const hasDiscount =
    typeof product.salePrice === "number" &&
    product.salePrice > 0 &&
    product.salePrice < product.price;
  const price = hasDiscount ? product.salePrice : product.price;

  return (
    <section className={`tile ${dark ? "tile--dark" : "tile--light"}`}>
      <div className="tile-inner">
        <p className="tile-eyebrow">{product.brand}</p>
        <h2 className="tile-headline">{product.name}</h2>
        <p className="tile-sub">{buildTagline(product)}</p>
        <p className="tile-price">Từ {formatCurrency(price)}</p>
        <div className="tile-ctas">
          <Link className="link-chevron" to={`/products/${productId}`}>
            Tìm hiểu thêm ›
          </Link>
          <Link className="link-chevron" to={`/products/${productId}`}>
            Mua ›
          </Link>
        </div>
        <div className="tile-media">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [gridProducts, setGridProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const [featuredRes, gridRes] = await Promise.all([
          getProducts({ limit: 2, sort: "featured" }),
          getProducts({ limit: 6, sort: "best_selling" }),
        ]);
        setFeaturedProducts(featuredRes.data.items || []);
        setGridProducts(gridRes.data.items || []);
      } catch (error) {
        console.error("Không thể tải sản phẩm trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <>
      {/* Hero tile */}
      <section className="hero">
        <div className="container hero-inner hero-copy">
          <p className="eyebrow">Mobile Store</p>
          <h1>Công nghệ trong tầm tay.</h1>
          <p>
            Khám phá bộ sưu tập điện thoại, máy tính bảng và phụ kiện chính hãng
            với trải nghiệm mua sắm liền mạch.
          </p>
          <div className="hero-actions">
            <Link className="link-chevron" to="/products">
              Khám phá sản phẩm ›
            </Link>
            <Link className="link-chevron" to="/products">
              Xem ưu đãi ›
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <img
            src="/hero.png"
            alt="Sản phẩm nổi bật"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>
      </section>

      {/* Alternating product tiles */}
      {featuredProducts.map((product, index) => (
        <ProductTile
          key={product._id}
          product={product}
          dark={index % 2 === 0}
        />
      ))}

      {/* Feature strip */}
      <section className="tile tile--parchment">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Vì sao chọn chúng tôi</p>
            <h2>Một nền tảng thương mại điện tử hoàn chỉnh.</h2>
          </div>
          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="feature-item" key={feature.title}>
                  <Icon size={26} />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Store grid */}
      <section className="container section">
        <div className="section-heading inline">
          <div>
            <p className="eyebrow">Cửa hàng</p>
            <h2>Thiết bị bán chạy</h2>
          </div>
          <Link className="link-chevron" to="/products">
            Xem tất cả ›
          </Link>
        </div>

        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--ap-ink-48)",
            }}
          >
            Đang tải sản phẩm...
          </div>
        ) : (
          <div className="product-grid">
            {gridProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}

            {gridProducts.length === 0 && (
              <div
                className="empty-state"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                Chưa có sản phẩm nào được đăng bán.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
