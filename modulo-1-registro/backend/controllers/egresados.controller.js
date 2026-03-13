const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');

/**
 * GET /api/egresados/:id
 * Obtener perfil completo de un egresado
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT e.id_egresado, e.codigo_universitario, e.promocion,
              e.anio_ingreso, e.anio_egreso, e.anio_titulacion, e.promedio, e.situacion_laboral,
              p.id_persona, p.tipo_doc, p.num_doc, p.nombres, p.apellidos,
              p.email, p.telefono, p.direccion, p.foto_url,
              es.id_escuela, es.nombre AS escuela,
              f.id_facultad, f.nombre AS facultad,
              pp.resumen, pp.linkedin_url, pp.github_url, pp.portfolio_url,
              pp.disponibilidad, pp.modalidad_trabajo, pp.pretension_salarial, pp.privacidad_perfil, pp.sunedu_grado
       FROM egresados_unt.egresados e
       JOIN egresados_unt.personas p    ON p.id_persona  = e.id_persona
       JOIN egresados_unt.escuelas es   ON es.id_escuela = e.id_escuela
       JOIN egresados_unt.facultades f  ON f.id_facultad = es.id_facultad
       LEFT JOIN egresados_unt.perfiles_profesionales pp ON pp.id_egresado = e.id_egresado
       WHERE e.id_egresado = $1`,
      [id]
    );
    if (result.rows.length === 0) return error(res, 'Egresado no encontrado', 404);

    const egresado = result.rows[0];

    // Habilidades
    const habilidades = await db.query(
      `SELECT h.id_habilidad, h.nombre, h.categoria, eh.nivel
       FROM egresados_unt.egresado_habilidades eh
       JOIN egresados_unt.habilidades h ON h.id_habilidad = eh.id_habilidad
       WHERE eh.id_egresado = $1`,
      [id]
    );
    egresado.habilidades = habilidades.rows;

    // Experiencias
    const experiencias = await db.query(
      `SELECT * FROM egresados_unt.experiencias_laborales WHERE id_egresado = $1 ORDER BY fecha_inicio DESC`,
      [id]
    );
    egresado.experiencias = experiencias.rows;

    // Educación continua
    const educacion = await db.query(
      `SELECT * FROM egresados_unt.educacion_continua WHERE id_egresado = $1 ORDER BY fecha_inicio DESC`,
      [id]
    );
    egresado.educacion = educacion.rows;

    // Proyectos
    const proyectos = await db.query(
      `SELECT * FROM egresados_unt.proyectos_egresado WHERE id_egresado = $1 ORDER BY fecha_creacion DESC`,
      [id]
    );
    egresado.proyectos = proyectos.rows;

    success(res, egresado);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/egresados/:id
 * Actualizar datos del egresado
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') {
      return error(res, 'No tiene permiso para actualizar este perfil', 403);
    }

    const { nombres, apellidos, telefono, direccion, situacion_laboral } = req.body;

    // Obtener id_persona del egresado
    const egr = await db.query('SELECT id_persona FROM egresados_unt.egresados WHERE id_egresado = $1', [id]);
    if (egr.rows.length === 0) return error(res, 'Egresado no encontrado', 404);
    const { id_persona } = egr.rows[0];

    if (nombres || apellidos || telefono || direccion !== undefined) {
      await db.query(
        `UPDATE egresados_unt.personas
         SET nombres=$1, apellidos=$2, telefono=$3, direccion=$4
         WHERE id_persona=$5`,
        [nombres, apellidos, telefono, direccion, id_persona]
      );
    }

    if (situacion_laboral) {
      await db.query(
        'UPDATE egresados_unt.egresados SET situacion_laboral=$1 WHERE id_egresado=$2',
        [situacion_laboral, id]
      );
    }

    success(res, { id_egresado: id }, 'Egresado actualizado');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/egresados/buscar
 * Búsqueda con filtros
 */
exports.buscar = async (req, res, next) => {
  try {
    const { nombre, escuela, promocion, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (nombre) {
      conditions.push(`unaccent(p.nombres || ' ' || p.apellidos) ILIKE unaccent($${idx})`);
      params.push(`%${nombre}%`); idx++;
    }
    if (escuela) {
      conditions.push(`es.id_escuela = $${idx}`);
      params.push(escuela); idx++;
    }
    if (promocion) {
      conditions.push(`e.promocion = $${idx}`);
      params.push(promocion); idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM egresados_unt.egresados e
       JOIN egresados_unt.personas p  ON p.id_persona  = e.id_persona
       JOIN egresados_unt.escuelas es ON es.id_escuela = e.id_escuela
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT e.id_egresado, e.codigo_universitario, e.promocion, e.anio_egreso, e.situacion_laboral,
              p.nombres, p.apellidos, p.email, p.foto_url,
              es.nombre AS escuela, f.nombre AS facultad
       FROM egresados_unt.egresados e
       JOIN egresados_unt.personas p   ON p.id_persona  = e.id_persona
       JOIN egresados_unt.escuelas es  ON es.id_escuela = e.id_escuela
       JOIN egresados_unt.facultades f ON f.id_facultad = es.id_facultad
       ${where}
       ORDER BY p.apellidos, p.nombres
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    success(res, result.rows, 'Búsqueda exitosa', 200, paginate(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/egresados - Listar todos (admin)
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const countResult = await db.query('SELECT COUNT(*) FROM egresados_unt.egresados');
    const total = parseInt(countResult.rows[0].count);
    const result = await db.query(
      `SELECT e.id_egresado, e.codigo_universitario, e.promocion, e.anio_egreso, e.activo,
              p.nombres, p.apellidos, p.email, p.foto_url,
              es.nombre AS escuela
       FROM egresados_unt.egresados e
       JOIN egresados_unt.personas p   ON p.id_persona  = e.id_persona
       JOIN egresados_unt.escuelas es  ON es.id_escuela = e.id_escuela
       ORDER BY e.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    success(res, result.rows, 'Egresados obtenidos', 200, paginate(page, limit, total));
  } catch (err) {
    next(err);
  }
};
