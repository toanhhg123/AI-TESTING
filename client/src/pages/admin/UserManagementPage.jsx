import { Search, ShieldAlert, UserCheck, UserX, ChevronLeft, ChevronRight, RefreshCcw, Lock, Unlock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAdminUsers, toggleUserStatus, updateUserRole } from '../../api/adminApi';
import { useNotification } from '../../components/NotificationProvider.jsx';
import { getStoredUser } from '../../utils/authStorage';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const { showToast, showConfirm } = useNotification();
  const currentUser = getStoredUser();

  async function loadUsers(pageNumber = 1) {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: pageNumber,
        limit: 10,
      };
      if (filters.role) params.role = filters.role;
      if (filters.keyword) params.keyword = filters.keyword;

      const response = await getAdminUsers(params);
      setUsers(response.data.items || []);
      setPagination(response.data.pagination || {
        page: pageNumber,
        limit: 10,
        total: 0,
        totalPages: 1,
      });
    } catch (err) {
      console.error('Lỗi khi tải thành viên:', err);
      setError('Không thể lấy danh sách thành viên từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, [filters]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, keyword: searchInput }));
  }

  function handleRoleFilterChange(e) {
    setFilters((prev) => ({ ...prev, role: e.target.value }));
  }

  function handleReset() {
    setSearchInput('');
    setFilters({ keyword: '', role: '' });
  }

  async function handleToggleStatus(userId, currentStatus, userName) {
    if (userId === currentUser?._id) {
      showToast('Bạn không thể tự khóa tài khoản của chính mình!', 'warning');
      return;
    }

    const targetStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const actionText = targetStatus === 'blocked' ? 'KHÓA' : 'MỞ KHÓA';

    const confirmed = await showConfirm(
      'Thay đổi trạng thái tài khoản',
      `Bạn có chắc chắn muốn ${actionText} tài khoản của người dùng "${userName}"?`
    );

    if (!confirmed) return;

    setIsUpdating(true);
    try {
      await toggleUserStatus(userId, targetStatus);
      showToast(
        targetStatus === 'blocked'
          ? `Đã khóa tài khoản ${userName} thành công.`
          : `Đã mở khóa tài khoản ${userName} thành công.`,
        'success'
      );
      loadUsers(pagination.page);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái user:', err);
      const msg = err.response?.data?.message || 'Thao tác thất bại.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRoleToggle(userId, currentRole, userName) {
    if (userId === currentUser?._id) {
      showToast('Bạn không thể tự thay đổi quyền hạn của chính mình!', 'warning');
      return;
    }

    const targetRole = currentRole === 'admin' ? 'customer' : 'admin';
    const roleText = targetRole === 'admin' ? 'QUẢN TRỊ VIÊN (Admin)' : 'KHÁCH HÀNG (Customer)';

    const confirmed = await showConfirm(
      'Thay đổi quyền hạn thành viên',
      `Bạn có chắc chắn muốn đổi quyền của "${userName}" thành ${roleText}?`
    );

    if (!confirmed) return;

    setIsUpdating(true);
    try {
      await updateUserRole(userId, targetRole);
      showToast(`Đã thay đổi quyền của ${userName} thành công.`, 'success');
      loadUsers(pagination.page);
    } catch (err) {
      console.error('Lỗi cập nhật quyền hạn user:', err);
      const msg = err.response?.data?.message || 'Thao tác thất bại.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
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
          <h1>Quản lý người dùng</h1>
          <p>Xem danh sách tài khoản, thay đổi quyền hạn và khóa/mở khóa tài khoản thành viên.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="admin-filter-bar" style={{ gap: '12px', alignItems: 'center' }}>
        <form className="admin-search-form" onSubmit={handleSearchSubmit}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo Tên hoặc Email thành viên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <select
          className="admin-select"
          value={filters.role}
          onChange={handleRoleFilterChange}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem' }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng (Customer)</option>
          <option value="admin">Quản trị viên (Admin)</option>
        </select>

        {(filters.keyword || filters.role || searchInput) && (
          <button
            className="button secondary"
            type="button"
            onClick={handleReset}
            style={{ minHeight: '40px', padding: '0 16px', borderRadius: '10px' }}
          >
            Đặt lại
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {isLoading ? (
        <div className="empty-state">Đang tải danh sách thành viên...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">Không tìm thấy thành viên nào phù hợp.</div>
      ) : (
        <>
          <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên thành viên</th>
                  <th>Email</th>
                  <th>Ngày đăng ký</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user._id === currentUser?._id;
                  return (
                    <tr key={user._id} style={{ opacity: user.status === 'blocked' ? 0.75 : 1 }}>
                      <td>
                        <strong style={{ color: 'var(--ink)' }}>{user.fullName}</strong>
                        {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginLeft: '6px', fontWeight: 600 }}>(Tôi)</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{formatDate(user.createdAt)}</td>
                      <td>
                        <span className={`order-status-badge ${user.role === 'admin' ? 'status-confirmed' : 'status-shipping'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`order-status-badge ${user.status === 'blocked' ? 'status-cancelled' : 'status-completed'}`} style={{ fontSize: '0.75rem' }}>
                          {user.status === 'blocked' ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleRoleToggle(user._id, user.role, user.fullName)}
                            disabled={isUpdating || isSelf}
                            title={user.role === 'admin' ? 'Hạ quyền xuống Customer' : 'Thăng quyền lên Admin'}
                            style={{
                              border: '1px solid var(--border)',
                              background: 'var(--background)',
                              opacity: isSelf ? 0.35 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Shield size={16} />
                          </button>

                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleToggleStatus(user._id, user.status, user.fullName)}
                            disabled={isUpdating || isSelf}
                            title={user.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            style={{
                              border: `1px solid ${user.status === 'blocked' ? '#10b981' : '#ef4444'}`,
                              color: user.status === 'blocked' ? '#10b981' : '#ef4444',
                              background: user.status === 'blocked' ? '#ecfdf5' : '#fef2f2',
                              opacity: isSelf ? 0.35 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {user.status === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                Hiển thị {users.length} / {pagination.total} thành viên
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  style={{ border: '1px solid var(--border)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{ border: '1px solid var(--border)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
