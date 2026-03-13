const router = require('express').Router();
const db = require('../config/database');
const { verifyToken } = require('../../../shared/middleware/auth');
const { success } = require('../../../shared/utils/response');

router.get('/empleabilidad', verifyToken, async (req, res, next) => {
  try {
    const { anio, escuela } = req.query;
    const cond = []; const params = []; let idx = 1;
    if (anio)    { cond.push(`ie.anio=$${idx++}`); params.push(anio); }
    if (escuela) { cond.push(`ie.id_escuela=$${idx++}`); params.push(escuela); }
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    const r = await db.query(
      `SELECT ie.*, es.nombre AS escuela, f.nombre AS facultad
       FROM egresados_unt.indicadores_empleabilidad ie
       JOIN egresados_unt.escuelas es ON es.id_escuela=ie.id_escuela
       JOIN egresados_unt.facultades f ON f.id_facultad=es.id_facultad
       ${where} ORDER BY ie.anio DESC, ie.mes DESC`, params
    );
    success(res, r.rows);
  } catch(e) { next(e); }
});

module.exports = router;
