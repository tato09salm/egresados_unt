import axios from 'axios';

const apiBolsa = axios.create({ baseURL: 'http://localhost:3002', timeout: 10000 });
apiBolsa.interceptors.request.use(c => { const t = localStorage.getItem('sge_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
apiBolsa.interceptors.response.use(r => r, e => { if (e.response?.status === 401) { localStorage.removeItem('sge_token'); window.location.href = '/login'; } return Promise.reject(e); });

export default apiBolsa;
