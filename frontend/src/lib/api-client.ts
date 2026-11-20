import axios from 'axios';

// Hardcode URL Railway, pastikan ada /api
const baseURL = 'https://prakarsa-inventory-production-fcc6463b.up.railway.app';

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
