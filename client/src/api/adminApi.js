import axiosClient from './axiosClient';

export function getDashboardStats(params) {
  return axiosClient.get('/admin/dashboard', { params });
}

export function getAdminProducts(params) {
  return axiosClient.get('/admin/products', { params });
}

export function getAdminProductById(id) {
  return axiosClient.get(`/admin/products/${id}`);
}

export function createAdminProduct(payload) {
  return axiosClient.post('/admin/products', payload);
}

export function updateAdminProduct(id, payload) {
  return axiosClient.patch(`/admin/products/${id}`, payload);
}

export function deleteAdminProduct(id) {
  return axiosClient.delete(`/admin/products/${id}`);
}

export function getAdminOrders(params) {
  return axiosClient.get('/admin/orders', { params });
}

export function updateAdminOrderStatus(id, status) {
  return axiosClient.patch(`/admin/orders/${id}/status`, { status });
}

export function getAdminUsers(params) {
  return axiosClient.get('/admin/users', { params });
}

export function updateUserRole(id, role) {
  return axiosClient.patch(`/admin/users/${id}/role`, { role });
}

export function toggleUserStatus(id, status) {
  return axiosClient.patch(`/admin/users/${id}/status`, { status });
}

export function getImportReceipts(params) {
  return axiosClient.get('/admin/imports', { params });
}

export function getImportReceiptById(id) {
  return axiosClient.get(`/admin/imports/${id}`);
}

export function createImportReceipt(payload) {
  return axiosClient.post('/admin/imports', payload);
}

// Coupons CRUD
export function getAdminCoupons(params) {
  return axiosClient.get('/admin/coupons', { params });
}

export function createAdminCoupon(payload) {
  return axiosClient.post('/admin/coupons', payload);
}

export function updateAdminCoupon(id, payload) {
  return axiosClient.patch(`/admin/coupons/${id}`, payload);
}

export function deleteAdminCoupon(id) {
  return axiosClient.delete(`/admin/coupons/${id}`);
}

// Categories CRUD
export function getAdminCategories(params) {
  return axiosClient.get('/admin/categories', { params });
}

export function createAdminCategory(payload) {
  return axiosClient.post('/admin/categories', payload);
}

export function updateAdminCategory(id, payload) {
  return axiosClient.patch(`/admin/categories/${id}`, payload);
}

export function deleteAdminCategory(id) {
  return axiosClient.delete(`/admin/categories/${id}`);
}
