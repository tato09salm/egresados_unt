const { error } = require('../../../shared/utils/response');

/**
 * Middleware que verifica que el usuario autenticado tiene rol de administrador
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return error(res, 'No autenticado', 401);
  }

  if (req.user.rol !== 'admin') {
    return error(res, 'Acceso denegado. Se requieren permisos de administrador', 403);
  }

  next();
};

module.exports = isAdmin;
