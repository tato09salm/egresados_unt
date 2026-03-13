/**
 * Respuesta exitosa estándar
 */
const success = (res, data, message = 'Operación exitosa', statusCode = 200, pagination = null) => {
  const response = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

/**
 * Respuesta de error estándar
 */
const error = (res, message = 'Error interno', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Calcular paginación
 */
const paginate = (page = 1, limit = 10, total) => ({
  page: parseInt(page),
  limit: parseInt(limit),
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { success, error, paginate };
