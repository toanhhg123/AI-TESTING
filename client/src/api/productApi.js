import axiosClient from './axiosClient';

export function getProducts(params) {
  return axiosClient.get('/products', { params });
}

export function getProductById(id) {
  return axiosClient.get(`/products/${id}`);
}

export function searchProducts(params) {
  return axiosClient.get('/products/search', { params });
}

export function getRecommendations(params) {
  return axiosClient.get('/products/recommendations', { params });
}

export function createProductReview(id, payload) {
  return axiosClient.post(`/products/${id}/reviews`, payload);
}

export function getCategories() {
  return axiosClient.get('/products/categories');
}

export function getSimilarProducts(id) {
  return axiosClient.get(`/products/${id}/similar`);
}
