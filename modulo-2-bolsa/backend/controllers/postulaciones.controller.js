const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');

// Algoritmo de matching: calcula puntaje 0-100
async function calcularMatch(id_egresado, id_oferta) {
  try {
    // Habilidades del egresado
    const habEgr = await db.query(
      'SELECT id_habilidad FROM egresados_unt.egresado_habilidades WHERE id_egresado=$1', [id_egresado]
    );
    // Habilidades requeridas por la oferta
    const habOfe = await db.query(
      'SELECT id_habilidad, requerida FROM bolsa_laboral.oferta_habilidades WHERE id_oferta=$1', [id_oferta]
    );
    // Perfil del egresado
    const perfil = await db.query(
      `SELECT pp.modalidad_trabajo, pp.pretension_salarial
       FROM egresados_unt.perfiles_profesionales pp WHERE pp.id_egresado=$1`, [id_egresado]
    );
    // Datos de oferta
    const oferta = await db.query(
      'SELECT modalidad, salario_min, salario_max FROM bolsa_laboral.ofertas_laborales WHERE id_oferta=$1', [id_oferta]
    );

    const habsEgr = new Set(habEgr.rows.map(h => h.id_habilidad));
    const requeridas = habOfe.rows.filter(h => h.requerida);
    const opcionales = habOfe.rows.filter(h => !h.requerida);

    // 60% habilidades
    let puntHab = 0;
    if (requeridas.length > 0) {
      const coinciden = requeridas.filter(h => habsEgr.has(h.id_habilidad)).length;
      puntHab = (coinciden / requeridas.length) * 60;
    } else if (opcionales.length > 0) {
      const coinciden = opcionales.filter(h => habsEgr.has(h.id_habilidad)).length;
      puntHab = (coinciden / opcionales.length) * 60;
    } else { puntHab = 30; }

    // 20% modalidad
    let puntMod = 0;
    if (perfil.rows.length && oferta.rows.length) {
      const mod = perfil.rows[0].modalidad_trabajo;
      const ofMod = oferta.rows[0].modalidad;
      if (!mod || mod === 'cualquiera' || ofMod === mod || mod === 'hibrido' || ofMod === 'hibrido') puntMod = 20;
      else puntMod = 5;
    } else { puntMod = 10; }

    // 20% salario
    let puntSal = 0;
    if (perfil.rows.length && oferta.rows.length) {
      const pretension = parseFloat(perfil.rows[0].pretension_salarial || 0);
      const salMax = parseFloat(oferta.rows[0].salario_max || 0);
      if (!pretension || !salMax) puntSal = 10;
      else if (pretension <= salMax) puntSal = 20;
      else if (pretension <= salMax * 1.2) puntSal = 10;
      else puntSal = 0;
    } else { puntSal = 10; }

    return Math.round(puntHab + puntMod + puntSal);
  } catch { return 50; }
}

// POST /api/ofertas/:id/postular
exports.postular = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados pueden postular', 403);
    const { id } = req.params;
    const { carta_presentacion } = req.body;
    const id_egresado = req.user.id_egresado;

    const dup = await db.query('SELECT id_postulacion FROM bolsa_laboral.postulaciones WHERE id_oferta=$1 AND id_egresado=$2', [id, id_egresado]);
    if (dup.rows.length) return error(res, 'Ya postulaste a esta oferta', 409);

    const puntaje = await calcularMatch(id_egresado, id);
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
    const r = await db.query(
      `SELECT p.id_postulacion, p.estado, p.puntaje_match, p.fecha_postulacion,
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
    if (req.user.rol !== 'empresa' && req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
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
    success(res, r.rows, 'Postulantes obtenidos', 200, paginate(page, limit, parseInt(cnt.rows[0].count)));
  } catch (e) { next(e); }
};

// PUT /api/postulaciones/:id/estado
exports.cambiarEstado = async (req, res, next) => {
  try {
    if (req.user.rol !== 'empresa' && req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);
    const { estado, notas_empresa } = req.body;
    const valid = ['pendiente','revision','entrevista','aceptado','rechazado'];
    if (!valid.includes(estado)) return error(res, 'Estado inválido. Use: ' + valid.join(', '), 400);
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
    // Ofertas activas no postuladas
    const ofertas = await db.query(
      `SELECT o.id_oferta FROM bolsa_laboral.ofertas_laborales o
       WHERE o.estado='activa'
         AND o.id_oferta NOT IN (SELECT id_oferta FROM bolsa_laboral.postulaciones WHERE id_egresado=$1)
       ORDER BY o.fecha_publicacion DESC LIMIT 20`,
      [id_egresado]
    );
    const scores = await Promise.all(ofertas.rows.map(async o => ({
      id_oferta: o.id_oferta,
      puntaje: await calcularMatch(id_egresado, o.id_oferta)
    })));
    scores.sort((a, b) => b.puntaje - a.puntaje);
    const top5 = scores.slice(0, 5);

    const result = await Promise.all(top5.map(async s => {
      const r = await db.query(
        `SELECT o.id_oferta, o.titulo, o.modalidad, o.salario_min, o.salario_max,
                emp.nombre_comercial AS empresa, emp.logo_url, emp.sector
         FROM bolsa_laboral.ofertas_laborales o
         JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa
         WHERE o.id_oferta=$1`, [s.id_oferta]
      );
      return { ...r.rows[0], puntaje_match: s.puntaje };
    }));
    success(res, result);
  } catch (e) { next(e); }
};
