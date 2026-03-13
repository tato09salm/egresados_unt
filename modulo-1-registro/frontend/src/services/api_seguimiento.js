import axios from 'axios';

const apiSeguimiento = axios.create({ baseURL: 'http://localhost:3003', timeout: 10000 });
apiSeguimiento.interceptors.request.use(c => { const t = localStorage.getItem('sge_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
apiSeguimiento.interceptors.response.use(r => r, e => { if (e.response?.status === 401) { localStorage.removeItem('sge_token'); window.location.href = '/login'; } return Promise.reject(e); });

export default apiSeguimiento;
