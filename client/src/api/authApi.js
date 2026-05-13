import axiosClient from './axiosClient';

export function login(payload) {
  return axiosClient.post('/auth/login', payload);
}

export function register(payload) {
  return axiosClient.post('/auth/register', payload);
}

export function getCurrentUser() {
  return axiosClient.get('/auth/me');
}
