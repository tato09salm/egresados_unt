import axios from 'axios';

const apiBolsa = axios.create({
	baseURL: import.meta.env.VITE_API_BOLSA_URL || 'http://localhost:3002',
	timeout: 10000,
});
apiBolsa.interceptors.request.use(c => { const t = localStorage.getItem('sge_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
apiBolsa.interceptors.response.use(r => r, e => { if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem('sge_token'); window.location.href = '/login'; } return Promise.reject(e); });

export default apiBolsa;
