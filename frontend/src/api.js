import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthCall = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthCall && localStorage.getItem('token')) {
      // session expired: clear it and let React Router send the user to /login (keeps the page they were on)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export const fileUrl = (path) => (path ? `${API_ORIGIN}${path}` : null);

export const STATUSES = [
  { key: 'TODO', label: 'To Do', color: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'DONE', label: 'Done', color: 'bg-green-500' },
];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const TYPES = ['BUG', 'TASK', 'STORY'];

export default api;
