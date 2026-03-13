require('dotenv').config();
const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

const JWT_SECRET     = process.env.JWT_SECRET || 'sge_unt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login unificado: egresado o empresa
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'username y password requeridos', 400);

    // Intentar como egresado/admin primero
    const uResult = await db.query(
      `SELECT u.id_usuario, u.id_persona, u.username, u.password_hash, u.rol,
              p.nombres, p.apellidos, e.id_egresado
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       WHERE u.username = $1 OR p.email = $1`,
      [username]
    );
    if (uResult.rows.length > 0) {
      const u = uResult.rows[0];
      if (!await bcrypt.compare(password, u.password_hash)) return error(res, 'Credenciales inválidas', 401);
      await db.query('UPDATE egresados_unt.usuarios SET ultimo_login=NOW() WHERE id_usuario=$1', [u.id_usuario]);
      const token = jwt.sign({ id_usuario: u.id_usuario, id_persona: u.id_persona, id_egresado: u.id_egresado, rol: u.rol, username: u.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return success(res, { token, user: { id_usuario: u.id_usuario, id_egresado: u.id_egresado, nombres: u.nombres, apellidos: u.apellidos, rol: u.rol } });
    }

    // Intentar como empresa
    const eResult = await db.query(
      `SELECT ue.id_usuario_emp, ue.id_empresa, ue.email, ue.password_hash, ue.nombre,
              emp.razon_social, emp.nombre_comercial
       FROM bolsa_laboral.usuarios_empresa ue
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa = ue.id_empresa
       WHERE ue.email = $1 AND ue.activo = TRUE`,
      [username]
    );
    if (eResult.rows.length > 0) {
      const ue = eResult.rows[0];
      if (!await bcrypt.compare(password, ue.password_hash)) return error(res, 'Credenciales inválidas', 401);
      await db.query('UPDATE bolsa_laboral.usuarios_empresa SET ultimo_login=NOW() WHERE id_usuario_emp=$1', [ue.id_usuario_emp]);
      const token = jwt.sign({ id_usuario: ue.id_usuario_emp, id_empresa: ue.id_empresa, rol: 'empresa', username: ue.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return success(res, { token, user: { id_empresa: ue.id_empresa, nombre: ue.nombre, razon_social: ue.razon_social, rol: 'empresa' } });
    }

    return error(res, 'Credenciales inválidas', 401);
  } catch (err) { next(err); }
});

module.exports = router;
