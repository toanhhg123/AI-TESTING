import { SlidersHorizontal, Search } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { getProducts } from '../api/productApi';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const focusParam = searchParams.get('focus');
  const queryParam = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState(queryParam);

  // Sync keyword state when URL query param changes (e.g. from header click)
  useEffect(() => {
    setKeyword(queryParam);
  }, [queryParam]);

  // Autofocus logic
  useEffect(() => {
    if (focusParam === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [focusParam]);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const params = {
          page,
          limit: 6,
          sort,
        };

        if (brand) params.brand = brand;
        if (ram) params.ram = ram;
        if (storage) params.storage = storage;
        if (keyword) params.keyword = keyword;

        if (priceRange === 'under-5') {
          params.maxPrice = 5000000;
        } else if (priceRange === '5-15') {
          params.minPrice = 5000000;
          params.maxPrice = 15000000;
        } else if (priceRange === 'over-15') {
          params.minPrice = 15000000;
        }

        const response = await getProducts(params);
        setProducts(response.data.items || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Không thể tải danh sách sản phẩm:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [brand, priceRange, ram, storage, sort, page, keyword]);

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1); // Reset to page 1 on filter/sort change
    };
  }

  function handleSearchChange(e) {
    const val = e.target.value;
    setKeyword(val);
    setPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('q', val);
    } else {
      newParams.delete('q');
    }
    // Remove focus param after initial focus
    newParams.delete('focus');
    setSearchParams(newParams, { replace: true });
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Catalog"
        title="Danh sách sản phẩm"
        description="Tìm kiếm thiết bị di động mong muốn bằng cách sử dụng bộ lọc thương hiệu, khoảng giá, cấu hình RAM, dung lượng và sắp xếp linh hoạt."
      />

      <div className="search-bar-container" style={{ position: 'relative', marginBottom: '24px' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
          }}
        />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên, thương hiệu, cấu hình..."
          value={keyword}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '12px 16px 12px 46px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </div>

      <div className="catalog-layout">
        <aside className="filter-panel">
          <div className="panel-title">
            <SlidersHorizontal size={18} />
            <span>Bộ lọc</span>
          </div>
          <label>
            Sắp xếp
            <select value={sort} onChange={handleFilterChange(setSort)}>
              <option value="newest">Mới nhất</option>
              <option value="featured">Nổi bật</option>
              <option value="best_selling">Bán chạy</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </label>
          <label>
            Thương hiệu
            <select value={brand} onChange={handleFilterChange(setBrand)}>
              <option value="">Tất cả</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
            </select>
          </label>
          <label>
            Khoảng giá
            <select value={priceRange} onChange={handleFilterChange(setPriceRange)}>
              <option value="">Tất cả</option>
              <option value="under-5">Dưới 5 triệu</option>
              <option value="5-15">5 - 15 triệu</option>
              <option value="over-15">Trên 15 triệu</option>
            </select>
          </label>
          <label>
            Bộ nhớ RAM
            <select value={ram} onChange={handleFilterChange(setRam)}>
              <option value="">Tất cả</option>
              <option value="4GB">4 GB</option>
              <option value="6GB">6 GB</option>
              <option value="8GB">8 GB</option>
              <option value="12GB">12 GB</option>
              <option value="16GB">16 GB</option>
            </select>
          </label>
          <label>
            Bộ nhớ trong (Storage)
            <select value={storage} onChange={handleFilterChange(setStorage)}>
              <option value="">Tất cả</option>
              <option value="64GB">64 GB</option>
              <option value="128GB">128 GB</option>
              <option value="256GB">256 GB</option>
              <option value="512GB">512 GB</option>
              <option value="1TB">1 TB</option>
            </select>
          </label>
        </aside>

        <div className="catalog-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              Đang tải danh sách sản phẩm...
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}

                {!isLoading && products.length === 0 && (
                  <div className="empty-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px' }}>
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="pagination-bar" style={{ justifyContent: 'center', marginTop: '16px' }}>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </button>
                  <span style={{ fontWeight: 600 }}>
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
