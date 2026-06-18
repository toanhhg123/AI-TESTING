import axiosClient from './axiosClient';

export function getDashboardStats() {
  return axiosClient.get('/admin/dashboard');
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

export function getAdminUsers(params) {
  return axiosClient.get('/admin/users', { params });
}
