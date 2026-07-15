import { Plus, Edit2, Trash2, Ticket, X, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../../api/adminApi';
import { useNotification } from '../../components/NotificationProvider.jsx';

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { showToast, showConfirm } = useNotification();

  async function loadCoupons() {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAdminCoupons();
      setCoupons(response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải mã giảm giá:', err);
      setError('Không thể lấy danh sách mã giảm giá từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function handleOpenCreate() {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setMinOrderAmount(0);
    setExpiryDate('');
    setIsActive(true);
    setFormError('');
    setSelectedId(null);
    setModalMode('create');
    setIsModalOpen(true);
  }

  function handleOpenEdit(coupon) {
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderAmount(coupon.minOrderAmount || 0);
    
    // Format date to YYYY-MM-DD
    const dateStr = new Date(coupon.expiryDate).toISOString().split('T')[0];
    setExpiryDate(dateStr);
    
    setIsActive(coupon.isActive);
    setFormError('');
    setSelectedId(coupon._id);
    setModalMode('edit');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Mã giảm giá không được để trống.');
      return;
    }

    if (discountValue <= 0) {
      setFormError('Giá trị giảm giá phải lớn hơn 0.');
      return;
    }

    if (!expiryDate) {
      setFormError('Vui lòng chọn ngày hết hạn.');
      return;
    }

    setFormError('');
    setIsSubmitLoading(true);

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount),
      expiryDate,
      isActive,
    };

    try {
      if (modalMode === 'create') {
        await createAdminCoupon(payload);
        showToast('Tạo mã giảm giá mới thành công!', 'success');
      } else {
        await updateAdminCoupon(selectedId, payload);
        showToast('Cập nhật mã giảm giá thành công!', 'success');
      }
      setIsModalOpen(false);
      loadCoupons();
    } catch (err) {
      console.error('Lỗi lưu mã giảm giá:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá.';
      setFormError(msg);
    } finally {
      setIsSubmitLoading(false);
    }
  }

  async function handleDelete(id, couponCode) {
    const confirmed = await showConfirm(
      'Xác nhận xóa mã giảm giá',
      `Bạn có chắc chắn muốn xóa mã giảm giá "${couponCode}"? Thao tác này không thể hoàn tác.`
    );

    if (!confirmed) return;

    try {
      await deleteAdminCoupon(id);
      showToast(`Đã xóa mã giảm giá ${couponCode} thành công.`, 'success');
      loadCoupons();
    } catch (err) {
      console.error('Lỗi xóa mã giảm giá:', err);
      const msg = err.response?.data?.message || 'Không thể xóa mã giảm giá này.';
      showToast(msg, 'error');
    }
  }

  function formatValue(value, type) {
    if (type === 'percentage') return `${value}%`;
    return value.toLocaleString('vi-VN') + 'đ';
  }

  return (
    <section className="section">
      <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p className="eyebrow">Quản lý</p>
          <h2>Mã giảm giá (Coupons)</h2>
        </div>
        <button className="button primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm mã giảm giá
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          Đang tải danh sách mã giảm giá...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mã Coupon</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Loại</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Giá trị giảm</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Đơn tối thiểu</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Ngày hết hạn</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Chưa có mã giảm giá nào được tạo.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', opacity: isExpired ? 0.6 : 1 }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Ticket size={16} style={{ color: 'var(--accent)' }} />
                          {c.code}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '0.9rem', color: 'var(--ink)' }}>
                        {c.discountType === 'percentage' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--accent)' }}>
                        {formatValue(c.discountValue, c.discountType)}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        {c.minOrderAmount.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          {new Date(c.expiryDate).toLocaleDateString('vi-VN')}
                          {isExpired && <span style={{ color: 'red', fontSize: '10px', fontWeight: 600 }}>(Hết hạn)</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`order-status-badge ${c.isActive && !isExpired ? 'status-completed' : 'status-cancelled'}`} style={{ fontSize: '0.75rem' }}>
                          {c.isActive && !isExpired ? 'Hoạt động' : c.isActive ? 'Hết hạn' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Sửa Coupon"
                            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleDelete(c._id, c.code)}
                            title="Xóa Coupon"
                            style={{ border: '1px solid #ef4444', color: '#ef4444', background: '#fef2f2' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(21, 33, 47, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700 }}>
              {modalMode === 'create' ? 'Tạo mã giảm giá mới' : 'Chỉnh sửa mã giảm giá'}
            </h3>

            {formError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="coupon-code">Mã Coupon</label>
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="Ví dụ: KM10, GIAM50K..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="discount-type">Loại giảm giá</label>
                  <select id="discount-type" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Cố định (đ)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="discount-value">Giá trị giảm</label>
                  <input
                    id="discount-value"
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="min-order">Đơn tối thiểu (đ)</label>
                  <input
                    id="min-order"
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiry">Ngày hết hạn</label>
                  <input
                    id="expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  id="is-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is-active" style={{ cursor: 'pointer', margin: 0, userSelect: 'none' }}>
                  Kích hoạt mã giảm giá này
                </label>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={isSubmitLoading}
                  style={{ flex: 1 }}
                >
                  {isSubmitLoading ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
