import axios from 'axios';
import { io } from 'socket.io-client';

const hostname = window.location.hostname;

const isLanOrLocal =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

export const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (isLanOrLocal
    ? `http://${hostname}:5001`
    : 'https://your-mediqueue-backend.onrender.com');

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