/**
 * Middleware global de manejo de errores para Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // Error de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({ success: false, message: 'Registro duplicado: ' + (err.detail || 'El valor ya existe') });
      case '23503': // foreign_key_violation
        return res.status(400).json({ success: false, message: 'Referencia inválida: ' + (err.detail || 'Registro relacionado no existe') });
      case '23502': // not_null_violation
        return res.status(400).json({ success: false, message: 'Campo requerido: ' + err.column });
      case '22P02': // invalid_text_representation
        return res.status(400).json({ success: false, message: 'Formato de dato inválido' });
      default:
        return res.status(500).json({ success: false, message: 'Error de base de datos', code: err.code });
    }
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
