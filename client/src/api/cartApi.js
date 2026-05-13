import axiosClient from './axiosClient';

export function getCart() {
  return axiosClient.get('/cart');
}

export function addCartItem(payload) {
  return axiosClient.post('/cart/items', payload);
}

export function updateCartItem(productId, payload) {
  return axiosClient.patch(`/cart/items/${productId}`, payload);
}

export function removeCartItem(productId) {
  return axiosClient.delete(`/cart/items/${productId}`);
}
