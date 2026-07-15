import { Search, Eye, Plus, ChevronLeft, ChevronRight, X, User, BarChart3, ShieldAlert, Package, Trash2, ArrowUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAdminProducts, updateAdminProduct, getImportReceipts, getImportReceiptById, createImportReceipt } from '../../api/adminApi';
import { useNotification } from '../../components/NotificationProvider.jsx';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'imports'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Stock list states
  const [products, setProducts] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [stockTotal, setStockTotal] = useState(0);

  // Quick adjust stock states
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustStockVal, setAdjustStockVal] = useState(0);

  // Import list states
  const [receipts, setReceipts] = useState([]);
  const [importsPage, setImportsPage] = useState(1);
  const [importsTotalPages, setImportsTotalPages] = useState(1);
  const [importsTotal, setImportsTotal] = useState(0);

  // Import Details Modal state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New Import Receipt Form Modal states
  const [isNewImportOpen, setIsNewImportOpen] = useState(false);
  const [supplierInput, setSupplierInput] = useState('');
  const [importItems, setImportItems] = useState([{ product: '', quantity: 1, importPrice: '' }]);
  const [allProductsList, setAllProductsList] = useState([]); // Loaded for selecting inside dropdown

  const { showToast, showConfirm } = useNotification();

  // Load products list
  async function loadProducts(pageNumber = 1, keyword = '') {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAdminProducts({
        page: pageNumber,
        limit: 10,
        keyword,
      });
      setProducts(response.data.items || []);
      setStockTotal(response.data.pagination?.total || 0);
      setStockTotalPages(response.data.pagination?.totalPages || 1);
      setStockPage(pageNumber);
    } catch (err) {
      console.error('Lỗi khi tải tồn kho sản phẩm:', err);
      setError('Không thể tải danh sách sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  }

  // Load import receipts list
  async function loadImportReceipts(pageNumber = 1) {
    setIsLoading(true);
    setError('');
    try {
      const response = await getImportReceipts({
        page: pageNumber,
        limit: 10,
      });
      setReceipts(response.data.items || []);
      setImportsTotal(response.data.pagination?.total || 0);
      setImportsTotalPages(response.data.pagination?.totalPages || 1);
      setImportsPage(pageNumber);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử nhập hàng:', err);
      setError('Không thể tải lịch sử phiếu nhập hàng.');
    } finally {
      setIsLoading(false);
    }
  }

  // Load all products (without page limit, or high limit) for new import select dropdown
  async function loadAllProductsForDropdown() {
    try {
      const response = await getAdminProducts({ limit: 100 });
      setAllProductsList(response.data.items || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm nhập:', err);
    }
  }

  useEffect(() => {
    if (activeTab === 'stock') {
      loadProducts(1, stockSearch);
    } else {
      loadImportReceipts(1);
    }
  }, [activeTab]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadProducts(1, stockSearch);
  }

  // Handle Quick Adjust Stock
  async function handleQuickStockAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustingProduct) return;

    if (adjustStockVal < 0) {
      showToast('Tồn kho không thể nhỏ hơn 0.', 'warning');
      return;
    }

    const confirmed = await showConfirm(
      'Cập nhật tồn kho',
      `Bạn có chắc chắn muốn cập nhật tồn kho của "${adjustingProduct.name}" thành ${adjustStockVal} máy không?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      await updateAdminProduct(adjustingProduct._id, { stock: adjustStockVal });
      showToast('Cập nhật tồn kho nhanh thành công!', 'success');
      setAdjustingProduct(null);
      loadProducts(stockPage, stockSearch);
    } catch (err) {
      console.error('Lỗi điều chỉnh kho:', err);
      const msg = err.response?.data?.message || 'Không thể cập nhật tồn kho.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle New Import Row Add/Remove
  function handleAddImportRow() {
    setImportItems([...importItems, { product: '', quantity: 1, importPrice: '' }]);
  }

  function handleRemoveImportRow(idx) {
    if (importItems.length <= 1) return;
    setImportItems(importItems.filter((_, i) => i !== idx));
  }

  function handleImportRowChange(idx, field, value) {
    const updated = [...importItems];
    updated[idx][field] = value;
    setImportItems(updated);
  }

  // Handle Submit New Import Receipt
  async function handleCreateImportSubmit(e) {
    e.preventDefault();
    if (!supplierInput.trim()) {
      showToast('Vui lòng nhập nhà cung cấp.', 'warning');
      return;
    }

    // Verify items
    const invalidItem = importItems.find(item => !item.product || item.quantity <= 0 || !item.importPrice);
    if (invalidItem) {
      showToast('Vui lòng điền đầy đủ và đúng thông tin các sản phẩm nhập.', 'warning');
      return;
    }

    const confirmed = await showConfirm(
      'Lập phiếu nhập hàng',
      `Bạn có chắc chắn muốn lập phiếu nhập từ nhà cung cấp "${supplierInput}" để cộng dồn tồn kho không?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      const payload = {
        supplier: supplierInput.trim(),
        items: importItems.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          importPrice: parseFloat(item.importPrice),
        })),
      };

      await createImportReceipt(payload);
      showToast('Lập phiếu nhập hàng thành công! Đã cộng dồn tồn kho.', 'success');
      
      // Reset form
      setSupplierInput('');
      setImportItems([{ product: '', quantity: 1, importPrice: '' }]);
      setIsNewImportOpen(false);

      // Refresh list
      loadImportReceipts(1);
    } catch (err) {
      console.error('Lỗi tạo phiếu nhập:', err);
      const msg = err.response?.data?.message || 'Không thể tạo phiếu nhập hàng.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  // Opening new import dialog
  function openNewImportModal() {
    loadAllProductsForDropdown();
    setIsNewImportOpen(true);
  }

  // Opening receipt details modal
  async function openReceiptDetail(id) {
    setIsUpdating(true);
    try {
      const response = await getImportReceiptById(id);
      setSelectedReceipt(response.data.receipt);
    } catch (err) {
      console.error('Lỗi tải chi tiết phiếu nhập:', err);
      showToast('Không thể tải chi tiết phiếu nhập hàng.', 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  function formatPrice(amount) {
    return amount !== undefined ? amount.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Quản lý kho & Nhập hàng</h1>
          <p>Giám sát tồn kho thiết bị và quản lý phiếu nhập hàng từ nhà phân phối.</p>
        </div>
      </div>

      {/* Tabs Switch bar */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px', paddingBottom: '2px' }}>
        <button
          className={`admin-tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'stock' ? '2.5px solid var(--accent)' : 'none',
            color: activeTab === 'stock' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Tồn kho sản phẩm
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'imports' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('imports')}
          style={{
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'imports' ? '2.5px solid var(--accent)' : 'none',
            color: activeTab === 'imports' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Lịch sử nhập hàng
        </button>
      </div>

      {/* Tab 1: Stock Management */}
      {activeTab === 'stock' && (
        <>
          {/* Filters Bar */}
          <div className="admin-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <form className="admin-search-form" onSubmit={handleSearchSubmit}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </form>
            {stockSearch && (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setStockSearch('');
                  loadProducts(1, '');
                }}
                style={{ minHeight: '40px', borderRadius: '10px' }}
              >
                Đặt lại
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="empty-state">Đang tải danh sách tồn kho...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">Không tìm thấy sản phẩm nào.</div>
          ) : (
            <>
              <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Thương hiệu</th>
                      <th>Giá bán</th>
                      <th>Lượt đã bán</th>
                      <th>Tồn kho</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                          <strong style={{ color: 'var(--ink)' }}>{p.name}</strong>
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(p.salePrice && p.salePrice > 0 ? p.salePrice : p.price)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{p.soldCount} máy</td>
                        <td>
                          <span
                            className={`order-status-badge ${p.stock <= 5 ? 'status-cancelled' : 'status-completed'}`}
                            style={{ fontSize: '0.82rem', fontWeight: 700 }}
                          >
                            {p.stock} máy {p.stock <= 5 ? '(Sắp hết)' : ''}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustStockVal(p.stock);
                            }}
                            style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', minHeight: '32px' }}
                          >
                            Điều chỉnh nhanh
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {stockTotalPages > 1 && (
                <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                    Hiển thị {products.length} / {stockTotal} sản phẩm
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => loadProducts(stockPage - 1, stockSearch)}
                      disabled={stockPage <= 1}
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                      Trang {stockPage} / {stockTotalPages}
                    </span>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => loadProducts(stockPage + 1, stockSearch)}
                      disabled={stockPage >= stockTotalPages}
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Tab 2: Imports Management */}
      {activeTab === 'imports' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button
              className="button primary"
              type="button"
              onClick={openNewImportModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
            >
              <Plus size={18} />
              <span>Lập phiếu nhập mới</span>
            </button>
          </div>

          {isLoading ? (
            <div className="empty-state">Đang tải lịch sử nhập hàng...</div>
          ) : receipts.length === 0 ? (
            <div className="empty-state">Chưa lập phiếu nhập hàng nào.</div>
          ) : (
            <>
              <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Nhà cung cấp</th>
                      <th>Ngày lập</th>
                      <th>Tổng tiền nhập</th>
                      <th>Người lập</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt._id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                            #PN-{receipt._id.substring(receipt._id.length - 8).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{receipt.supplier}</td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{formatDate(receipt.createdAt)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{formatPrice(receipt.totalAmount)}</td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{receipt.creator?.fullName}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => openReceiptDetail(receipt._id)}
                            title="Xem chi tiết phiếu nhập"
                            style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {importsTotalPages > 1 && (
                <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                    Hiển thị {receipts.length} / {importsTotal} phiếu nhập
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => loadImportReceipts(importsPage - 1)}
                      disabled={importsPage <= 1}
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                      Trang {importsPage} / {importsTotalPages}
                    </span>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => loadImportReceipts(importsPage + 1)}
                      disabled={importsPage >= importsTotalPages}
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal Quick Stock Adjust Form */}
      {adjustingProduct && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', width: 'calc(100% - 32px)', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Cập nhật nhanh tồn kho
              </h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => setAdjustingProduct(null)}
                style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickStockAdjustSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Sản phẩm cần sửa</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{adjustingProduct.name}</strong>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="adjustStockInput">Số lượng tồn kho mới</label>
                <input
                  id="adjustStockInput"
                  type="number"
                  min="0"
                  value={adjustStockVal}
                  onChange={(e) => setAdjustStockVal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Đóng
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Receipt Details */}
      {selectedReceipt && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '640px', width: 'calc(100% - 32px)', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Chi tiết phiếu nhập #PN-{selectedReceipt._id.toUpperCase()}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Thời gian nhập: {formatDate(selectedReceipt.createdAt)}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: 'var(--background)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <strong>Nhà cung cấp:</strong> {selectedReceipt.supplier}
              </div>
              <div>
                <strong>Người lập phiếu:</strong> {selectedReceipt.creator?.fullName} ({selectedReceipt.creator?.email})
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Danh sách sản phẩm nhập</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', marginBottom: '20px' }}>
              {selectedReceipt.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    borderBottom: index < selectedReceipt.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <img
                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'}
                    alt={item.product?.name || 'Sản phẩm'}
                    style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)', background: 'var(--background)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product?.name || 'Sản phẩm đã xóa khỏi hệ thống'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Giá nhập lẻ: {formatPrice(item.importPrice)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--accent)' }}>
                      {formatPrice(item.quantity * item.importPrice)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Số lượng: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <span style={{ fontWeight: 600 }}>Tổng chi phí nhập hàng:</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>{formatPrice(selectedReceipt.totalAmount)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="button secondary"
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ borderRadius: '10px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Create New Import Receipt */}
      {isNewImportOpen && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '680px', width: 'calc(100% - 32px)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Lập phiếu nhập hàng nhà cung cấp
              </h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsNewImportOpen(false)}
                style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateImportSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="supplierInput">Tên Nhà cung cấp / Nhà phân phối</label>
                <input
                  id="supplierInput"
                  type="text"
                  placeholder="Ví dụ: Công ty TNHH FPT Synnex"
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0 }}>Sản phẩm nhập hàng</h4>
                <button
                  className="button secondary"
                  type="button"
                  onClick={handleAddImportRow}
                  style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} />
                  Thêm dòng
                </button>
              </div>

              {/* Items List Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border)', padding: '12px', borderRadius: '12px' }}>
                {importItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 2 }}>
                      {idx === 0 && <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Chọn sản phẩm</label>}
                      <select
                        className="admin-select"
                        value={item.product}
                        onChange={(e) => handleImportRowChange(idx, 'product', e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', width: '100%', outline: 'none' }}
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {allProductsList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.brand})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 0.8 }}>
                      {idx === 0 && <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số lượng</label>}
                      <input
                        type="number"
                        min="1"
                        placeholder="Số lượng"
                        value={item.quantity}
                        onChange={(e) => handleImportRowChange(idx, 'quantity', e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', width: '100%', outline: 'none' }}
                      />
                    </div>

                    <div style={{ flex: 1.2 }}>
                      {idx === 0 && <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Đơn giá nhập</label>}
                      <input
                        type="number"
                        min="0"
                        placeholder="Giá nhập lẻ"
                        value={item.importPrice}
                        onChange={(e) => handleImportRowChange(idx, 'importPrice', e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', width: '100%', outline: 'none' }}
                      />
                    </div>

                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => handleRemoveImportRow(idx)}
                      disabled={importItems.length <= 1}
                      title="Xóa dòng"
                      style={{
                        padding: '10px',
                        border: '1px solid var(--border)',
                        color: importItems.length <= 1 ? 'var(--muted)' : '#ef4444',
                        background: 'var(--background)',
                        borderRadius: '8px',
                        cursor: importItems.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: importItems.length <= 1 ? 0.4 : 1,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total calculated price preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
                <span style={{ fontWeight: 600 }}>Tạm tính tổng tiền phiếu:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
                  {formatPrice(
                    importItems.reduce((sum, item) => {
                      const q = parseInt(item.quantity) || 0;
                      const p = parseFloat(item.importPrice) || 0;
                      return sum + q * p;
                    }, 0)
                  )}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setIsNewImportOpen(false)}
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={isUpdating}
                  style={{ borderRadius: '10px' }}
                >
                  Tạo phiếu & Nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
