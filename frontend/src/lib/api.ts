import axios from 'axios';

const baseURL = 'https://api.theprakarsa.org';

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
