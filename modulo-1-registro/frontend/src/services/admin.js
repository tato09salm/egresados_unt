import api from './api';

const adminService = {
  getUsuarios: () => api.get('/api/admin/usuarios'),
  getUsuariosSinEgresado: () => api.get('/api/admin/usuarios/sin-egresado'),
  crearEgresado: (data) => api.post('/api/admin/egresados', data),
  eliminarEgresado: (id) => api.delete(`/api/admin/egresados/${id}`),
};

export default adminService;
