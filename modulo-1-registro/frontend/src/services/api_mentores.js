import axios from 'axios';

const apiMentores = axios.create({ baseURL: '', timeout: 10000 });
apiMentores.interceptors.request.use(c => { const t = localStorage.getItem('sge_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
apiMentores.interceptors.response.use(r => r, e => { if (e.response?.status === 401) { localStorage.removeItem('sge_token'); window.location.href = '/login'; } return Promise.reject(e); });

export default apiMentores;
