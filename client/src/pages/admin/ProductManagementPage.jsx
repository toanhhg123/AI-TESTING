import { Edit, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from '../../api/adminApi';

const emptyForm = {
  name: '',
  sku: '',
  brand: '',
  category: 'Điện thoại',
  price: '',
  salePrice: '',
  stock: '',
  imageData: '',
  description: '',
  tags: '',
  isFeatured: false,
  status: 'active',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function toForm(product) {
  return {
    name: product.name || '',
    sku: product.sku || '',
    brand: product.brand || '',
    category: product.category || 'Điện thoại',
    price: String(product.price ?? ''),
    salePrice: String(product.salePrice ?? ''),
    stock: String(product.stock ?? ''),
    imageData: product.images?.[0] || '',
    description: product.description || '',
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
    isFeatured: Boolean(product.isFeatured),
    status: product.status || 'active',
  };
}

function toPayload(form) {
  return {
    name: form.name,
    sku: form.sku || undefined,
    brand: form.brand,
    category: form.category,
    price: Number(form.price || 0),
    salePrice: Number(form.salePrice || 0),
    stock: Number(form.stock || 0),
    images: form.imageData ? [form.imageData] : [],
    description: form.description,
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    isFeatured: form.isFeatured,
    status: form.status,
  };
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    brand: '',
    category: '',
    status: 'active',
    sort: 'newest',
  });
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const totalLabel = useMemo(() => {
    if (pagination.total === 0) {
      return 'Chưa có sản phẩm';
    }

    return `${pagination.total} sản phẩm`;
  }, [pagination.total]);

  async function loadProducts(page = pagination.page) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = {
        ...filters,
        page,
        limit: pagination.limit,
      };

      for (const key of Object.keys(params)) {
        if (params[key] === '') {
          delete params[key];
        }
      }

      const response = await getAdminProducts(params);

      setProducts(response.data.items || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(1);
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateForm(event) {
    const { name, type, checked, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn đúng file hình ảnh.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ảnh không được vượt quá 2MB khi lưu base64 vào database.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageData: reader.result,
      }));
      setErrorMessage('');
    };

    reader.onerror = () => {
      setErrorMessage('Không thể đọc file ảnh. Vui lòng thử lại.');
    };

    reader.readAsDataURL(file);
  }

  function clearImage() {
    setForm((current) => ({
      ...current,
      imageData: '',
    }));
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function openEditForm(product) {
    setEditingProduct(product);
    setForm(toForm(product));
    setIsFormOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function closeForm() {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function handleFilterSubmit(event) {
    event.preventDefault();
    await loadProducts(1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct._id, toPayload(form));
        setSuccessMessage('Đã cập nhật sản phẩm.');
      } else {
        await createAdminProduct(toPayload(form));
        setSuccessMessage('Đã tạo sản phẩm mới.');
      }

      closeForm();
      await loadProducts(editingProduct ? pagination.page : 1);
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      const message =
        error.response?.data?.message ||
        (Array.isArray(apiErrors) ? apiErrors.join(' ') : '') ||
        'Không thể lưu sản phẩm.';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Xóa sản phẩm "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteAdminProduct(product._id);
      setSuccessMessage('Đã xóa sản phẩm.');
      await loadProducts(pagination.page);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  }

  async function goToPage(page) {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) {
      return;
    }

    await loadProducts(page);
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Theo dõi, tìm kiếm, tạo mới và cập nhật sản phẩm trong hệ thống.</p>
        </div>
        <button className="button primary" type="button" onClick={openCreateForm}>
          <Plus size={18} />
          Thêm sản phẩm
        </button>
      </div>

      <form className="admin-filter-bar" onSubmit={handleFilterSubmit}>
        <label>
          Từ khóa
          <div className="input-with-icon">
            <Search size={17} />
            <input
              name="keyword"
              value={filters.keyword}
              placeholder="Tên, thương hiệu, mô tả..."
              onChange={updateFilter}
            />
          </div>
        </label>
        <label>
          Thương hiệu
          <input name="brand" value={filters.brand} placeholder="Apple" onChange={updateFilter} />
        </label>
        <label>
          Danh mục
          <select name="category" value={filters.category} onChange={updateFilter}>
            <option value="">Tất cả</option>
            <option value="Điện thoại">Điện thoại</option>
            <option value="Máy tính bảng">Máy tính bảng</option>
            <option value="Phụ kiện">Phụ kiện</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">Tất cả</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ẩn</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </label>
        <label>
          Sắp xếp
          <select name="sort" value={filters.sort} onChange={updateFilter}>
            <option value="newest">Mới nhất</option>
            <option value="featured">Nổi bật</option>
            <option value="best_selling">Bán chạy</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="button primary" type="submit">
            Lọc
          </button>
          <button className="icon-button" type="button" onClick={() => loadProducts(pagination.page)}>
            <RefreshCcw size={18} />
          </button>
        </div>
      </form>

      {errorMessage ? <p className="form-message error">{errorMessage}</p> : null}
      {successMessage ? <p className="form-message success">{successMessage}</p> : null}

      {isFormOpen ? (
        <section className="admin-form-panel">
          <div className="admin-form-header">
            <div>
              <p className="eyebrow">{editingProduct ? 'Cập nhật' : 'Tạo mới'}</p>
              <h2>{editingProduct ? editingProduct.name : 'Sản phẩm mới'}</h2>
            </div>
            <button className="icon-button" type="button" onClick={closeForm}>
              <X size={18} />
            </button>
          </div>

          <form className="product-admin-form" onSubmit={handleSubmit}>
            <label>
              Tên sản phẩm
              <input name="name" value={form.name} onChange={updateForm} required />
            </label>
            <label>
              SKU
              <input name="sku" value={form.sku} onChange={updateForm} placeholder="IP15-128-BLK" />
            </label>
            <label>
              Thương hiệu
              <input name="brand" value={form.brand} onChange={updateForm} required />
            </label>
            <label>
              Danh mục
              <select name="category" value={form.category} onChange={updateForm} required>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Máy tính bảng">Máy tính bảng</option>
                <option value="Phụ kiện">Phụ kiện</option>
              </select>
            </label>
            <label>
              Giá
              <input name="price" type="number" min="0" value={form.price} onChange={updateForm} required />
            </label>
            <label>
              Giá khuyến mãi
              <input name="salePrice" type="number" min="0" value={form.salePrice} onChange={updateForm} />
            </label>
            <label>
              Tồn kho
              <input name="stock" type="number" min="0" value={form.stock} onChange={updateForm} required />
            </label>
            <label>
              Trạng thái
              <select name="status" value={form.status} onChange={updateForm}>
                <option value="active">Đang bán</option>
                <option value="inactive">Ẩn</option>
                <option value="deleted">Đã xóa</option>
              </select>
            </label>
            <div className="form-span-2 image-upload-field">
              <label>
                Ảnh sản phẩm
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
              {form.imageData ? (
                <div className="image-preview-box">
                  <img src={form.imageData} alt="Preview sản phẩm" />
                  <button className="button secondary" type="button" onClick={clearImage}>
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <p>Ảnh sẽ được chuyển sang base64 và lưu trực tiếp trong database.</p>
              )}
            </div>
            <label className="form-span-2">
              Tags
              <input name="tags" value={form.tags} onChange={updateForm} placeholder="iphone, apple, camera" />
            </label>
            <label className="form-span-2">
              Mô tả
              <textarea name="description" value={form.description} rows="4" onChange={updateForm} />
            </label>
            <label className="checkbox-field form-span-2">
              <input
                name="isFeatured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={updateForm}
              />
              Sản phẩm nổi bật
            </label>
            <div className="form-actions form-span-2">
              <button className="button secondary" type="button" onClick={closeForm}>
                Hủy
              </button>
              <button className="button primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="admin-table-card">
        <div className="admin-table-header">
          <strong>{totalLabel}</strong>
          {isLoading ? <span>Đang tải...</span> : <span>Trang {pagination.page}/{pagination.totalPages || 1}</span>}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Thương hiệu</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Kho</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">
                        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : null}
                      </div>
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.sku || product.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td>{product.brand}</td>
                  <td>{product.category}</td>
                  <td>
                    <strong>{formatCurrency(product.salePrice || product.price)}</strong>
                    {product.salePrice ? <span className="muted-price">{formatCurrency(product.price)}</span> : null}
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`status-pill ${product.status}`}>{product.status}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" type="button" onClick={() => openEditForm(product)}>
                        <Edit size={17} />
                      </button>
                      <button className="icon-button danger" type="button" onClick={() => handleDelete(product)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && products.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">Không có sản phẩm phù hợp.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <button
            className="button secondary"
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Trước
          </button>
          <span>{pagination.page}/{pagination.totalPages || 1}</span>
          <button
            className="button secondary"
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Sau
          </button>
        </div>
      </section>
    </section>
  );
}
