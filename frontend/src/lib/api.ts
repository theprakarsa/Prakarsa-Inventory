import axios from 'axios';

const baseURL = 'https://theprakarsa-inventory-production.up.railway.app/api';

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
