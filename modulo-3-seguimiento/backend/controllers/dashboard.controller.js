const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

// GET /api/dashboard/facultad/:id
exports.porFacultad = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT ie.anio, ie.mes,
              AVG(ie.tasa_empleabilidad)     AS tasa_empleabilidad,
              AVG(ie.tiempo_promedio_empleo) AS tiempo_promedio_empleo,
              AVG(ie.salario_promedio)       AS salario_promedio,
              COUNT(DISTINCT ie.id_escuela)  AS escuelas
       FROM egresados_unt.indicadores_empleabilidad ie
       JOIN egresados_unt.escuelas es ON es.id_escuela=ie.id_escuela
       WHERE es.id_facultad=$1
       GROUP BY ie.anio, ie.mes ORDER BY ie.anio DESC, ie.mes DESC LIMIT 24`,
      [req.params.id]
    );
    // Escuelas de la facultad
    const escuelas = await db.query(
      `SELECT es.id_escuela, es.nombre,
              ROUND(AVG(ie.tasa_empleabilidad)::numeric, 1) AS tasa,
              ROUND(AVG(ie.salario_promedio)::numeric, 0)   AS salario
       FROM egresados_unt.escuelas es
       LEFT JOIN egresados_unt.indicadores_empleabilidad ie ON ie.id_escuela=es.id_escuela
       WHERE es.id_facultad=$1 GROUP BY es.id_escuela, es.nombre ORDER BY tasa DESC NULLS LAST`,
      [req.params.id]
    );
    success(res, { tendencia: r.rows, escuelas: escuelas.rows });
  } catch (e) { next(e); }
};

// GET /api/dashboard/escuela/:id
exports.porEscuela = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT * FROM egresados_unt.indicadores_empleabilidad
       WHERE id_escuela=$1 ORDER BY anio DESC, mes DESC NULLS LAST LIMIT 24`,
      [req.params.id]
    );
    const total = await db.query(
      'SELECT COUNT(*) AS total FROM egresados_unt.egresados WHERE id_escuela=$1', [req.params.id]
    );
    success(res, { indicadores: r.rows, total_egresados: total.rows[0].total });
  } catch (e) { next(e); }
};

// GET /api/dashboard/tendencias
exports.tendencias = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT ie.anio,
              ROUND(AVG(ie.tasa_empleabilidad)::numeric, 1)     AS tasa_empleabilidad,
              ROUND(AVG(ie.tiempo_promedio_empleo)::numeric, 1) AS tiempo_promedio,
              ROUND(AVG(ie.salario_promedio)::numeric, 0)       AS salario_promedio,
              COUNT(DISTINCT ie.id_escuela) AS escuelas_registradas
       FROM egresados_unt.indicadores_empleabilidad ie
       WHERE ie.anio >= EXTRACT(YEAR FROM NOW()) - 3
       GROUP BY ie.anio ORDER BY ie.anio`
    );
    const kpis = await db.query(
      `SELECT
         COUNT(DISTINCT e.id_egresado) AS total_egresados,
         COUNT(DISTINCT CASE WHEN e.situacion_laboral='empleado' THEN e.id_egresado END) AS empleados,
         COUNT(DISTINCT o.id_oferta)   AS ofertas_activas,
         COUNT(DISTINCT p.id_postulacion) AS postulaciones_mes
       FROM egresados_unt.egresados e
       CROSS JOIN (SELECT COUNT(*) FROM bolsa_laboral.ofertas_laborales WHERE estado='activa') o(id_oferta)
       CROSS JOIN (SELECT COUNT(*) FROM bolsa_laboral.postulaciones WHERE fecha_postulacion >= NOW()-INTERVAL '30 days') p(id_postulacion)`
    );
    success(res, { tendencias: r.rows, kpis: kpis.rows[0] });
  } catch (e) { next(e); }
};
