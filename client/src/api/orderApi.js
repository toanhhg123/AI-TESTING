import axiosClient from './axiosClient';

export function getOrders() {
  return axiosClient.get('/orders');
}

export function getOrderById(id) {
  return axiosClient.get(`/orders/${id}`);
}

export function createOrder(payload) {
  return axiosClient.post('/orders', payload);
}

export function lookupOrder(orderId) {
  return axiosClient.get('/orders/lookup', {
    params: { orderId },
  });
}
