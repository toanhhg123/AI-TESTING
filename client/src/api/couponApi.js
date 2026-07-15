import axiosClient from './axiosClient';

export function validateCoupon(payload) {
  return axiosClient.post('/coupons/validate', payload);
}
