import axiosClient from './axiosClient';

export function getDashboardStats() {
  return axiosClient.get('/admin/dashboard');
}

export function getAdminProducts(params) {
  return axiosClient.get('/admin/products', { params });
}

export function getAdminOrders(params) {
  return axiosClient.get('/admin/orders', { params });
}

export function getAdminUsers(params) {
  return axiosClient.get('/admin/users', { params });
}
