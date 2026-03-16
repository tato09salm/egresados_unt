const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');
const { calculateMatchScore, listTopRecommendedOffers } = require('../services/matching.service');

const ESTADOS_POSTULACION = ['pendiente', 'revision', 'entrevista', 'aceptado', 'rechazado'];

// POST /api/ofertas/:id/postular
exports.postular = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados pueden postular', 403);
    const { id } = req.params;
    const { carta_presentacion } = req.body;
    const id_egresado = req.user.id_egresado;

    const dup = await db.query('SELECT id_postulacion FROM bolsa_laboral.postulaciones WHERE id_oferta=$1 AND id_egresado=$2', [id, id_egresado]);
    if (dup.rows.length) return error(res, 'Ya postulaste a esta oferta', 409);

    const oferta = await db.query('SELECT estado FROM bolsa_laboral.ofertas_laborales WHERE id_oferta=$1', [id]);
    if (!oferta.rows.length) return error(res, 'Oferta no encontrada', 404);
    if (oferta.rows[0].estado !== 'activa') return error(res, 'La oferta no está activa', 400);

    const puntaje = await calculateMatchScore(id_egresado, id);
    const r = await db.query(
      `INSERT INTO bolsa_laboral.postulaciones (id_oferta, id_egresado, carta_presentacion, puntaje_match)
       VALUES ($1,$2,$3,$4) RETURNING id_postulacion`,
      [id, id_egresado, carta_presentacion || null, puntaje]
    );
    success(res, { id_postulacion: r.rows[0].id_postulacion, puntaje_match: puntaje }, 'Postulación enviada', 201);
  } catch (e) { next(e); }
};

// GET /api/postulaciones/mis-postulaciones
exports.misPostulaciones = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados', 403);
    const r = await db.query(
      `SELECT p.id_postulacion, p.id_oferta, p.estado, p.puntaje_match, p.fecha_postulacion,
              o.titulo, o.modalidad, o.salario_min, o.salario_max,
              emp.nombre_comercial AS empresa, emp.logo_url
       FROM bolsa_laboral.postulaciones p
       JOIN bolsa_laboral.ofertas_laborales o ON o.id_oferta=p.id_oferta
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa
       WHERE p.id_egresado=$1 ORDER BY p.fecha_postulacion DESC`,
      [req.user.id_egresado]
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// GET /api/postulaciones/oferta/:id  (empresa)
exports.postulantesOferta = async (req, res, next) => {
  try {
    if (req.user.rol !== 'empresa') return error(res, 'Sin permiso', 403);
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.max(parseInt(req.query.limit || 20, 10), 1);
    const offset = (page - 1) * limit;

    const oferta = await db.query('SELECT id_empresa FROM bolsa_laboral.ofertas_laborales WHERE id_oferta=$1', [req.params.id]);
    if (!oferta.rows.length) return error(res, 'Oferta no encontrada', 404);
    if (oferta.rows[0].id_empresa !== req.user.id_empresa) return error(res, 'Sin permiso sobre esta oferta', 403);

    const cnt = await db.query('SELECT COUNT(*) FROM bolsa_laboral.postulaciones WHERE id_oferta=$1', [req.params.id]);
    const r = await db.query(
      `SELECT p.id_postulacion, p.estado, p.puntaje_match, p.carta_presentacion, p.fecha_postulacion, p.notas_empresa,
              per.nombres, per.apellidos, per.email, per.telefono, per.foto_url,
              e.codigo_universitario, e.anio_egreso,
              es.nombre AS escuela
       FROM bolsa_laboral.postulaciones p
       JOIN egresados_unt.egresados e ON e.id_egresado=p.id_egresado
       JOIN egresados_unt.personas per ON per.id_persona=e.id_persona
       JOIN egresados_unt.escuelas es ON es.id_escuela=e.id_escuela
       WHERE p.id_oferta=$1
       ORDER BY p.puntaje_match DESC NULLS LAST, p.fecha_postulacion
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    success(res, r.rows, 'Postulantes obtenidos', 200, paginate(page, limit, parseInt(cnt.rows[0].count, 10)));
  } catch (e) { next(e); }
};

// PUT /api/postulaciones/:id/estado
exports.cambiarEstado = async (req, res, next) => {
  try {
    if (req.user.rol !== 'empresa') return error(res, 'Sin permiso', 403);
    const { estado, notas_empresa } = req.body;
    if (!ESTADOS_POSTULACION.includes(estado)) {
      return error(res, 'Estado inválido. Use: ' + ESTADOS_POSTULACION.join(', '), 400);
    }

    const actual = await db.query(
      `SELECT p.estado, o.id_empresa
       FROM bolsa_laboral.postulaciones p
       JOIN bolsa_laboral.ofertas_laborales o ON o.id_oferta = p.id_oferta
       WHERE p.id_postulacion = $1`,
      [req.params.id]
    );

    if (!actual.rows.length) return error(res, 'Postulación no encontrada', 404);
    if (actual.rows[0].id_empresa !== req.user.id_empresa) return error(res, 'Sin permiso sobre esta postulación', 403);

    const transicionesValidas = {
      pendiente: ['revision'],
      revision: ['entrevista'],
      entrevista: ['aceptado', 'rechazado'],
      aceptado: [],
      rechazado: [],
    };

    const estadoActual = actual.rows[0].estado;
    if (!transicionesValidas[estadoActual].includes(estado)) {
      return error(res, `Transición inválida: ${estadoActual} -> ${estado}`, 400);
    }

    await db.query(
      'UPDATE bolsa_laboral.postulaciones SET estado=$1, notas_empresa=COALESCE($2,notas_empresa) WHERE id_postulacion=$3',
      [estado, notas_empresa, req.params.id]
    );
    success(res, { estado }, 'Estado actualizado');
  } catch (e) { next(e); }
};

// GET /api/match/recomendaciones
exports.recomendaciones = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados', 403);
    const id_egresado = req.user.id_egresado;
    const result = await listTopRecommendedOffers(id_egresado, 5);
    success(res, result);
  } catch (e) { next(e); }
};
