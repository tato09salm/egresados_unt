const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

/** PUT /api/perfil/:id - Actualizar resumen y redes sociales */
exports.updatePerfil = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') {
      return error(res, 'No tiene permiso', 403);
    }
    const { resumen, linkedin_url, github_url, portfolio_url, disponibilidad, modalidad_trabajo, pretension_salarial, privacidad_perfil } = req.body;
    await db.query(
      `INSERT INTO egresados_unt.perfiles_profesionales (id_egresado, resumen, linkedin_url, github_url, portfolio_url, disponibilidad, modalidad_trabajo, pretension_salarial, privacidad_perfil)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id_egresado) DO UPDATE SET
         resumen=$2, linkedin_url=$3, github_url=$4, portfolio_url=$5,
         disponibilidad=$6, modalidad_trabajo=$7, pretension_salarial=$8, privacidad_perfil=$9`,
      [id, resumen, linkedin_url, github_url, portfolio_url, disponibilidad, modalidad_trabajo, pretension_salarial, privacidad_perfil || 'publico']
    );
    success(res, { id_egresado: id }, 'Perfil actualizado');
  } catch (err) {
    next(err);
  }
};

/** POST /api/perfil/:id/habilidades */
exports.addHabilidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { id_habilidad, nivel } = req.body;
    if (!id_habilidad) return error(res, 'id_habilidad requerido', 400);
    await db.query(
      `INSERT INTO egresados_unt.egresado_habilidades (id_egresado, id_habilidad, nivel)
       VALUES ($1,$2,$3)
       ON CONFLICT (id_egresado, id_habilidad) DO UPDATE SET nivel=$3`,
      [id, id_habilidad, nivel || 'intermedio']
    );
    success(res, null, 'Habilidad agregada', 201);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/perfil/:id/habilidades/:id_habilidad */
exports.removeHabilidad = async (req, res, next) => {
  try {
    const { id, id_habilidad } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    await db.query('DELETE FROM egresados_unt.egresado_habilidades WHERE id_egresado=$1 AND id_habilidad=$2', [id, id_habilidad]);
    success(res, null, 'Habilidad eliminada');
  } catch (err) {
    next(err);
  }
};

/** POST /api/perfil/:id/experiencia */
exports.addExperiencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { empresa, cargo, fecha_inicio, fecha_fin, descripcion, actual } = req.body;
    if (!empresa || !cargo || !fecha_inicio) return error(res, 'empresa, cargo y fecha_inicio son requeridos', 400);
    const result = await db.query(
      `INSERT INTO egresados_unt.experiencias_laborales (id_egresado, empresa, cargo, fecha_inicio, fecha_fin, descripcion, actual)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, empresa, cargo, fecha_inicio, fecha_fin || null, descripcion || null, actual || false]
    );
    success(res, result.rows[0], 'Experiencia agregada', 201);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/perfil/:id/experiencia/:id_exp */
exports.removeExperiencia = async (req, res, next) => {
  try {
    const { id, id_exp } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    await db.query('DELETE FROM egresados_unt.experiencias_laborales WHERE id_exp=$1 AND id_egresado=$2', [id_exp, id]);
    success(res, null, 'Experiencia eliminada');
  } catch (err) {
    next(err);
  }
};

/** PUT /api/perfil/:id/experiencia/:id_exp */
exports.updateExperiencia = async (req, res, next) => {
  try {
    const { id, id_exp } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { empresa, cargo, fecha_inicio, fecha_fin, descripcion, actual } = req.body;
    await db.query(
      `UPDATE egresados_unt.experiencias_laborales 
       SET empresa=$1, cargo=$2, fecha_inicio=$3, fecha_fin=$4, descripcion=$5, actual=$6, updated_at=NOW()
       WHERE id_exp=$7 AND id_egresado=$8`,
      [empresa, cargo, fecha_inicio, actual ? null : (fecha_fin || null), descripcion || null, actual || false, id_exp, id]
    );
    success(res, null, 'Experiencia actualizada');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/perfil/:id/educacion
 */
exports.addEducacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { tipo, nombre, institucion, fecha_inicio, fecha_fin, url_certificado } = req.body;

    const result = await db.query(
      `INSERT INTO egresados_unt.educacion_continua 
        (id_egresado, tipo, nombre, institucion, fecha_inicio, fecha_fin, url_certificado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, tipo, nombre, institucion, fecha_inicio || null, fecha_fin || null, url_certificado || null]
    );

    success(res, result.rows[0], 'Educación agregada', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/perfil/:id/educacion/:id_edu
 */
exports.removeEducacion = async (req, res, next) => {
  try {
    const { id, id_edu } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    await db.query(
      'DELETE FROM egresados_unt.educacion_continua WHERE id_egresado = $1 AND id_edu = $2',
      [id, id_edu]
    );
    success(res, null, 'Educación eliminada');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/perfil/:id/educacion/:id_edu
 */
exports.updateEducacion = async (req, res, next) => {
  try {
    const { id, id_edu } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { tipo, nombre, institucion, fecha_inicio, fecha_fin, url_certificado } = req.body;
    await db.query(
      `UPDATE egresados_unt.educacion_continua 
       SET tipo=$1, nombre=$2, institucion=$3, fecha_inicio=$4, fecha_fin=$5, url_certificado=$6, updated_at=NOW()
       WHERE id_edu=$7 AND id_egresado=$8`,
      [tipo, nombre, institucion, fecha_inicio || null, fecha_fin || null, url_certificado || null, id_edu, id]
    );
    success(res, null, 'Educación actualizada');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/perfil/habilidades
 */
exports.getHabilidades = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM egresados_unt.habilidades WHERE estado = TRUE ORDER BY categoria, nombre'
    );
    success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/** POST /api/perfil/:id/proyectos */
exports.addProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    const { titulo } = req.body;
    if (!titulo) return error(res, 'titulo requerido', 400);
    // Tabla no existe en el esquema actual
    success(res, { id_proy: 'mock-id' }, 'Proyecto agregado (simulado)', 201);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/perfil/:id/proyectos/:id_proy */
exports.removeProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id_egresado !== id && req.user.rol !== 'admin') return error(res, 'No tiene permiso', 403);
    // Tabla no existe en el esquema actual
    success(res, null, 'Proyecto eliminado (simulado)');
  } catch (err) {
    next(err);
  }
};

/** GET /api/perfil/:id/timeline */
exports.getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Combinar hitos académicos, laborales y educación continua
    const query = `
      (SELECT fecha_inicio as fecha, cargo || ' en ' || empresa as titulo, 'laboral' as tipo FROM egresados_unt.experiencias_laborales WHERE id_egresado = $1)
      UNION ALL
      (SELECT fecha_inicio as fecha, nombre || ' en ' || institucion as titulo, 'educacion' as tipo FROM egresados_unt.educacion_continua WHERE id_egresado = $1)
      UNION ALL
      (SELECT TO_DATE(anio_egreso::text, 'YYYY') as fecha, 'Egreso de ' || es.nombre as titulo, 'academico' as tipo 
       FROM egresados_unt.egresados e 
       JOIN egresados_unt.escuelas es ON es.id_escuela = e.id_escuela
       WHERE e.id_egresado = $1 AND e.anio_egreso IS NOT NULL)
      ORDER BY fecha DESC
    `;
    const result = await db.query(query, [id]);
    success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/** GET /api/perfil/escuelas - Listar escuelas con facultad */
exports.getEscuelas = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT es.id_escuela, es.codigo, es.nombre, f.nombre AS facultad, f.id_facultad
       FROM egresados_unt.escuelas es
       JOIN egresados_unt.facultades f ON f.id_facultad = es.id_facultad
       WHERE es.estado = TRUE ORDER BY f.nombre, es.nombre`
    );
    success(res, result.rows);
  } catch (err) {
    next(err);
  }
};
