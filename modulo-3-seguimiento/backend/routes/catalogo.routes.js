const router = require('express').Router();
const db = require('../config/database');
const { verifyToken } = require('../../../shared/middleware/auth');
const { success } = require('../../../shared/utils/response');

router.get('/facultades', verifyToken, async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id_facultad, nombre
       FROM egresados_unt.facultades
       ORDER BY nombre`
    );
    success(res, r.rows);
  } catch (e) { next(e); }
});

router.get('/escuelas', verifyToken, async (req, res, next) => {
  try {
    const { facultad } = req.query;
    const params = [];
    let where = '';
    if (facultad) {
      params.push(facultad);
      where = 'WHERE id_facultad=$1';
    }
    const r = await db.query(
      `SELECT id_escuela, id_facultad, nombre
       FROM egresados_unt.escuelas
       ${where}
       ORDER BY nombre`,
      params
    );
    success(res, r.rows);
  } catch (e) { next(e); }
});

module.exports = router;

