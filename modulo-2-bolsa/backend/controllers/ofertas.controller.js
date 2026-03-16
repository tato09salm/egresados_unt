const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');
const { calculateMatchScore } = require('../services/matching.service');

// GET /api/ofertas
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.max(parseInt(req.query.limit || 10, 10), 1);
    const offset = (page - 1) * limit;
    const { modalidad, sector, salario_min, salario_max, habilidad, habilidades, tipo_contrato, estado, mine } = req.query;

    const cond = [];
    const params = [];
    let idx = 1;

    const verSoloActivas = !(req.user?.rol === 'empresa' && mine === 'true') && req.user?.rol !== 'admin';
    if (verSoloActivas) {
      cond.push(`o.estado = 'activa'`);
    } else if (estado && estado !== 'todas') {
      cond.push(`o.estado = $${idx++}`);
      params.push(estado);
    }

    if (req.user?.rol === 'empresa' && mine === 'true') {
      cond.push(`o.id_empresa = $${idx++}`);
      params.push(req.user.id_empresa);
    }

    if (modalidad) { cond.push(`o.modalidad = $${idx++}`); params.push(modalidad); }
    if (tipo_contrato) { cond.push(`o.tipo_contrato = $${idx++}`); params.push(tipo_contrato); }
    if (sector)    { cond.push(`LOWER(emp.sector) = LOWER($${idx++})`); params.push(sector); }

    let salarioMinNum = salario_min !== undefined && salario_min !== '' ? Number(salario_min) : null;
    let salarioMaxNum = salario_max !== undefined && salario_max !== '' ? Number(salario_max) : null;
    if (salarioMinNum !== null && salarioMaxNum !== null && salarioMinNum > salarioMaxNum) {
      [salarioMinNum, salarioMaxNum] = [salarioMaxNum, salarioMinNum];
    }
    if (salarioMinNum !== null) {
      cond.push(`COALESCE(o.salario_min, o.salario_max, 0) >= $${idx++}`);
      params.push(salarioMinNum);
    }
    if (salarioMaxNum !== null) {
      cond.push(`COALESCE(o.salario_max, o.salario_min, 0) <= $${idx++}`);
      params.push(salarioMaxNum);
    }

    if (habilidad) {
      cond.push(`EXISTS (
        SELECT 1
        FROM bolsa_laboral.oferta_habilidades oh
        JOIN egresados_unt.habilidades h ON h.id_habilidad = oh.id_habilidad
        WHERE oh.id_oferta = o.id_oferta
          AND h.nombre ILIKE $${idx++}
      )`);
      params.push(`%${habilidad}%`);
    }

    const habilidadesSeleccionadas = (habilidades || '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (habilidadesSeleccionadas.length > 0) {
      cond.push(`EXISTS (
        SELECT 1
        FROM bolsa_laboral.oferta_habilidades oh
        JOIN egresados_unt.habilidades h ON h.id_habilidad = oh.id_habilidad
        WHERE oh.id_oferta = o.id_oferta
          AND LOWER(h.nombre) = ANY($${idx++}::text[])
      )`);
      params.push(habilidadesSeleccionadas);
    }

    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const cnt = await db.query(`SELECT COUNT(*) FROM bolsa_laboral.ofertas_laborales o JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa ${where}`, params);
    const rows = await db.query(
      `SELECT o.id_oferta, o.titulo, o.descripcion, o.modalidad, o.tipo_contrato,
              o.salario_min, o.salario_max, o.vacantes, o.fecha_publicacion, o.fecha_cierre,
              emp.nombre_comercial AS empresa, emp.logo_url, emp.sector, emp.tamano,
              (SELECT COUNT(*) FROM bolsa_laboral.postulaciones p2 WHERE p2.id_oferta=o.id_oferta) AS total_postulantes
       FROM bolsa_laboral.ofertas_laborales o
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa
       ${where} ORDER BY o.fecha_publicacion DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );

    let data = rows.rows;
    if (req.user?.rol === 'egresado' && req.user.id_egresado) {
      data = await Promise.all(
        rows.rows.map(async (o) => ({
          ...o,
          puntaje_match: await calculateMatchScore(req.user.id_egresado, o.id_oferta),
        }))
      );
    }

    success(res, data, 'Ofertas obtenidas', 200, paginate(page, limit, parseInt(cnt.rows[0].count, 10)));
  } catch (e) { next(e); }
};

// GET /api/ofertas/sectores
exports.getSectores = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT DISTINCT emp.sector
       FROM bolsa_laboral.ofertas_laborales o
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa = o.id_empresa
       WHERE emp.sector IS NOT NULL AND TRIM(emp.sector) <> ''
       ORDER BY emp.sector`
    );
    success(res, r.rows.map((x) => x.sector));
  } catch (e) { next(e); }
};

// GET /api/ofertas/:id
exports.getById = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT o.*, emp.nombre_comercial AS empresa, emp.razon_social, emp.logo_url,
              emp.sector, emp.sitio_web, emp.tamano, emp.verificada
       FROM bolsa_laboral.ofertas_laborales o
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa
       WHERE o.id_oferta=$1`, [req.params.id]
    );
    if (!r.rows.length) return error(res, 'Oferta no encontrada', 404);
    const oferta = r.rows[0];
    const habs = await db.query(
      `SELECT h.nombre, h.categoria, oh.requerida
       FROM bolsa_laboral.oferta_habilidades oh
       JOIN egresados_unt.habilidades h ON h.id_habilidad=oh.id_habilidad
       WHERE oh.id_oferta=$1`, [req.params.id]
    );
    oferta.habilidades = habs.rows;
    if (req.user?.rol === 'egresado' && req.user.id_egresado) {
      oferta.puntaje_match = await calculateMatchScore(req.user.id_egresado, req.params.id);
    }
    success(res, oferta);
  } catch (e) { next(e); }
};

// GET /api/ofertas/habilidades
exports.getHabilidades = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id_habilidad, nombre, categoria
       FROM egresados_unt.habilidades
       WHERE estado = TRUE
       ORDER BY nombre`
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// POST /api/ofertas
exports.create = async (req, res, next) => {
  try {
    if (req.user.rol !== 'empresa') return error(res, 'Solo empresa autenticada puede crear ofertas', 403);
    const { titulo, descripcion, requisitos, beneficios, salario_min, salario_max, modalidad, tipo_contrato, fecha_cierre, vacantes, habilidades } = req.body;
    if (!titulo || !descripcion) return error(res, 'titulo y descripcion son requeridos', 400);
    const r = await db.query(
      `INSERT INTO bolsa_laboral.ofertas_laborales (id_empresa, titulo, descripcion, requisitos, beneficios, salario_min, salario_max, modalidad, tipo_contrato, fecha_cierre, vacantes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_oferta`,
      [req.user.id_empresa, titulo, descripcion, requisitos, beneficios, salario_min, salario_max, modalidad || 'presencial', tipo_contrato || 'indefinido', fecha_cierre || null, vacantes || 1]
    );
    const id_oferta = r.rows[0].id_oferta;
    if (habilidades?.length) {
      for (const h of habilidades) {
        await db.query('INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta,id_habilidad,requerida) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [id_oferta, h.id_habilidad, h.requerida !== false]);
      }
    }
    success(res, { id_oferta }, 'Oferta creada', 201);
  } catch (e) { next(e); }
};

// PUT /api/ofertas/:id
exports.update = async (req, res, next) => {
  try {
    const oferta = await db.query('SELECT id_empresa FROM bolsa_laboral.ofertas_laborales WHERE id_oferta=$1', [req.params.id]);
    if (!oferta.rows.length) return error(res, 'Oferta no encontrada', 404);
    if (req.user.rol !== 'empresa' || oferta.rows[0].id_empresa !== req.user.id_empresa) return error(res, 'Sin permiso', 403);
    const { titulo, descripcion, requisitos, salario_min, salario_max, modalidad, vacantes, estado } = req.body;
    await db.query(
      `UPDATE bolsa_laboral.ofertas_laborales SET titulo=COALESCE($1,titulo), descripcion=COALESCE($2,descripcion),
       requisitos=COALESCE($3,requisitos), salario_min=COALESCE($4,salario_min), salario_max=COALESCE($5,salario_max),
       modalidad=COALESCE($6,modalidad), vacantes=COALESCE($7,vacantes), estado=COALESCE($8,estado) WHERE id_oferta=$9`,
      [titulo, descripcion, requisitos, salario_min, salario_max, modalidad, vacantes, estado, req.params.id]
    );
    success(res, { id_oferta: req.params.id }, 'Oferta actualizada');
  } catch (e) { next(e); }
};

// DELETE /api/ofertas/:id/cerrar
exports.cerrar = async (req, res, next) => {
  try {
    const oferta = await db.query('SELECT id_empresa FROM bolsa_laboral.ofertas_laborales WHERE id_oferta=$1', [req.params.id]);
    if (!oferta.rows.length) return error(res, 'Oferta no encontrada', 404);
    if (req.user.rol !== 'empresa' || oferta.rows[0].id_empresa !== req.user.id_empresa) return error(res, 'Sin permiso', 403);
    await db.query("UPDATE bolsa_laboral.ofertas_laborales SET estado='cerrada' WHERE id_oferta=$1", [req.params.id]);
    success(res, null, 'Oferta cerrada');
  } catch (e) { next(e); }
};
