const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sge_unt_secret_key_2024';

/**
 * Middleware que verifica el token JWT en el header Authorization
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Formato de token inválido. Use: Bearer <token>' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id_usuario: decoded.id_usuario,
      id_persona: decoded.id_persona,
      id_egresado: decoded.id_egresado || null,
      id_empresa: decoded.id_empresa || null,
      rol: decoded.rol,
      username: decoded.username,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Token expirado. Inicie sesión nuevamente' });
    }
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
};

/**
 * Middleware que verifica que el rol del usuario esté en el array permitido
 * @param {string[]} roles - Roles permitidos
 */
const checkRol = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { verifyToken, checkRol };
