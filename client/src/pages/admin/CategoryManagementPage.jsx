import { Plus, Edit2, Trash2, Folder, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../../api/adminApi';
import { useNotification } from '../../components/NotificationProvider.jsx';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { showToast, showConfirm } = useNotification();

  async function loadCategories() {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAdminCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
      setError('Không thể lấy danh sách danh mục từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleOpenCreate() {
    setName('');
    setDescription('');
    setFormError('');
    setSelectedId(null);
    setModalMode('create');
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat) {
    setName(cat.name);
    setDescription(cat.description || '');
    setFormError('');
    setSelectedId(cat._id);
    setModalMode('edit');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Tên danh mục không được để trống.');
      return;
    }

    setFormError('');
    setIsSubmitLoading(true);

    try {
      if (modalMode === 'create') {
        await createAdminCategory({ name: name.trim(), description: description.trim() });
        showToast('Tạo danh mục mới thành công!', 'success');
      } else {
        await updateAdminCategory(selectedId, { name: name.trim(), description: description.trim() });
        showToast('Cập nhật danh mục thành công!', 'success');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      console.error('Lỗi lưu danh mục:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục.';
      setFormError(msg);
    } finally {
      setIsSubmitLoading(false);
    }
  }

  async function handleDelete(id, catName) {
    const confirmed = await showConfirm(
      'Xác nhận xóa danh mục',
      `Bạn có chắc chắn muốn xóa danh mục "${catName}"? Thao tác này không thể hoàn tác.`
    );

    if (!confirmed) return;

    try {
      await deleteAdminCategory(id);
      showToast(`Đã xóa danh mục ${catName} thành công.`, 'success');
      loadCategories();
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      const msg = err.response?.data?.message || 'Không thể xóa danh mục này.';
      showToast(msg, 'error');
    }
  }

  return (
    <section className="section">
      <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p className="eyebrow">Quản lý</p>
          <h2>Danh mục sản phẩm</h2>
        </div>
        <button className="button primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          Đang tải danh sách danh mục...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tên danh mục</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mô tả</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Chưa có danh mục nào được tạo.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--ink)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Folder size={16} style={{ color: 'var(--accent)' }} />
                        {cat.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.description || 'Không có mô tả.'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          title="Sửa danh mục"
                          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => handleDelete(cat._id, cat.name)}
                          title="Xóa danh mục"
                          style={{ border: '1px solid #ef4444', color: '#ef4444', background: '#fef2f2' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              {modalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
            </h3>

            {formError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="cat-name">Tên danh mục</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="Ví dụ: Điện thoại, Phụ kiện..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cat-desc">Mô tả</label>
                <textarea
                  id="cat-desc"
                  rows="4"
                  placeholder="Nhập mô tả ngắn cho danh mục..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                  }}
                />
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
