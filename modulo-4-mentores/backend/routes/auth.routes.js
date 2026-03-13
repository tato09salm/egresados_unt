require('dotenv').config();
const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'username y password requeridos', 400);
    const result = await db.query(
      `SELECT u.id_usuario, u.id_persona, u.username, u.password_hash, u.rol,
              p.nombres, p.apellidos, e.id_egresado
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       WHERE u.username = $1 OR p.email = $1`, [username]
    );
    if (!result.rows.length) return error(res, 'Credenciales inválidas', 401);
    const u = result.rows[0];
    if (!await bcrypt.compare(password, u.password_hash)) return error(res, 'Credenciales inválidas', 401);
    const token = jwt.sign(
      { id_usuario:u.id_usuario, id_persona:u.id_persona, id_egresado:u.id_egresado, rol:u.rol, username:u.username },
      process.env.JWT_SECRET || 'sge_unt_secret_key_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    success(res, { token, user:{ id_usuario:u.id_usuario, id_egresado:u.id_egresado, nombres:u.nombres, apellidos:u.apellidos, rol:u.rol } });
  } catch(e) { next(e); }
});

module.exports = router;
