import axios from 'axios';
import { io } from 'socket.io-client';

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (isLocal ? 'http://localhost:5001' : 'https://your-mediqueue-backend.onrender.com');

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
});