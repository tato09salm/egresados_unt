const bcrypt = require('bcrypt');
const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

// POST /api/empresas/register
exports.register = async (req, res, next) => {
  try {
    const { ruc, razon_social, nombre_comercial, sector, tamano, sitio_web, email_contacto, password, nombre_contacto, cargo_contacto } = req.body;
    if (!ruc || !razon_social || !email_contacto || !password) return error(res, 'ruc, razon_social, email y password son requeridos', 400);
    const dup = await db.query('SELECT id_empresa FROM bolsa_laboral.empresas WHERE ruc=$1', [ruc]);
    if (dup.rows.length) return error(res, 'RUC ya registrado', 409);
    const emp = await db.query(
      `INSERT INTO bolsa_laboral.empresas (ruc, razon_social, nombre_comercial, sector, tamano, sitio_web)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_empresa`,
      [ruc, razon_social, nombre_comercial || razon_social, sector, tamano || 'mediana', sitio_web || null]
    );
    const id_empresa = emp.rows[0].id_empresa;
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO bolsa_laboral.usuarios_empresa (id_empresa, email, password_hash, nombre, cargo)
       VALUES ($1,$2,$3,$4,$5)`,
      [id_empresa, email_contacto, hash, nombre_contacto || '', cargo_contacto || '']
    );
    success(res, { id_empresa }, 'Empresa registrada exitosamente', 201);
  } catch (e) { next(e); }
};

// GET /api/empresas
exports.getAll = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id_empresa, ruc, razon_social, nombre_comercial, sector, tamano, logo_url, verificada
       FROM bolsa_laboral.empresas WHERE estado=TRUE ORDER BY razon_social`
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// GET /api/empresas/:id
exports.getById = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM bolsa_laboral.ofertas_laborales o WHERE o.id_empresa=e.id_empresa AND o.estado='activa') AS ofertas_activas
       FROM bolsa_laboral.empresas e WHERE e.id_empresa=$1`, [req.params.id]
    );
    if (!r.rows.length) return error(res, 'Empresa no encontrada', 404);
    success(res, r.rows[0]);
  } catch (e) { next(e); }
};
