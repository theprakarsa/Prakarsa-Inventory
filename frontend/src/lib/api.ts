import axios from 'axios';

// Pastikan URL tidak berakhiran /api agar tidak dobel
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const baseURL = rawBaseURL.replace(/\/api\/?$/, ''); // Hapus /api jika ada

export const api = axios.create({
  baseURL: `${baseURL}/api`, // Otomatis tambahkan /api
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
