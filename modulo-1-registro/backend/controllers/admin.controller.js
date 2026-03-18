const bcrypt = require('bcrypt');
const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

/**
 * GET /api/admin/usuarios
 * Listar todos los usuarios con info de si tienen egresado
 */
exports.getUsuarios = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT u.id_usuario, u.username, u.rol, u.activo, u.created_at,
             p.nombres, p.apellidos, p.email,
             e.id_egresado,
             CASE WHEN e.id_egresado IS NOT NULL THEN true ELSE false END as tiene_egresado
      FROM egresados_unt.usuarios u
      JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
      LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
      ORDER BY u.created_at DESC
    `);
    success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/usuarios/sin-egresado
 * Usuarios que no tienen perfil de egresado asociado
 */
exports.getUsuariosSinEgresado = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT u.id_usuario, u.username, p.nombres, p.apellidos, p.email, p.id_persona
      FROM egresados_unt.usuarios u
      JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
      LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
      WHERE e.id_egresado IS NULL AND u.rol = 'egresado'
      ORDER BY p.apellidos, p.nombres
    `);
    success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/egresados
 * Crear un egresado completo (Persona + Usuario + Egresado)
 */
exports.crearEgresado = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { 
      // Datos Personales
      tipo_doc, num_doc, nombres, apellidos, email, telefono, direccion,
      // Credenciales
      username, password,
      // Datos Académicos
      codigo_universitario, id_escuela, promocion, anio_ingreso, anio_egreso, anio_titulacion,
      sunedu_grado 
    } = req.body;

    // Validaciones básicas requeridas para el flujo completo
    if (!nombres || !apellidos || !email || !username || !password || !codigo_universitario || !id_escuela) {
      return error(res, 'Faltan campos obligatorios para el registro completo', 400);
    }

    await client.query('BEGIN');

    // 1. Verificar si el email o username ya existen
    const userCheck = await client.query(
      'SELECT id_usuario FROM egresados_unt.usuarios WHERE username = $1', [username]
    );
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'El nombre de usuario ya está registrado', 409);
    }

    const emailCheck = await client.query(
      'SELECT id_persona FROM egresados_unt.personas WHERE email = $1', [email]
    );
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'El email ya está registrado en el sistema', 409);
    }

    // 2. Verificar código universitario único
    const codeCheck = await client.query(
      'SELECT id_egresado FROM egresados_unt.egresados WHERE codigo_universitario = $1', [codigo_universitario]
    );
    if (codeCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'El código universitario ya está registrado', 409);
    }

    // 3. Crear Persona
    const personaRes = await client.query(`
      INSERT INTO egresados_unt.personas 
        (tipo_doc, num_doc, nombres, apellidos, email, telefono, direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_persona
    `, [tipo_doc || 'DNI', num_doc || '', nombres, apellidos, email, telefono || null, direccion || null]);
    
    const id_persona = personaRes.rows[0].id_persona;

    // 4. Crear Usuario
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(`
      INSERT INTO egresados_unt.usuarios (id_persona, username, password_hash, rol)
      VALUES ($1, $2, $3, 'egresado')
    `, [id_persona, username, passwordHash]);

    // 5. Crear Egresado
    const egresadoRes = await client.query(`
      INSERT INTO egresados_unt.egresados 
        (id_persona, codigo_universitario, id_escuela, promocion, anio_ingreso, anio_egreso, anio_titulacion, promedio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_egresado
    `, [id_persona, codigo_universitario, id_escuela, promocion || null, anio_ingreso || null, anio_egreso || null, anio_titulacion || null, 0]);
    
    const id_egresado = egresadoRes.rows[0].id_egresado;

    // 6. Crear perfil profesional base
    await client.query(`
      INSERT INTO egresados_unt.perfiles_profesionales (id_egresado)
      VALUES ($1)
    `, [id_egresado]);

    await client.query('COMMIT');
    success(res, { id_egresado }, 'Egresado y usuario creados exitosamente', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/admin/egresados/:id
 * Eliminar perfil de egresado (mantiene el usuario)
 */
exports.eliminarEgresado = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM egresados_unt.egresados WHERE id_egresado = $1', [id]);
    success(res, null, 'Perfil de egresado eliminado correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bitacora
 * Lista accesos (login/logout) y el último módulo visitado
 * Solo administrador
 */
exports.getBitacoraAccesos = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const { rows } = await db.query(
      `SELECT
         a.id_acceso,
         a.username,
         a.nombres,
         a.rol,
         a.modulo_actual,
         a.ingreso_at,
         a.salida_at,
         a.ip_origen
       FROM auditoria.accesos a
       ORDER BY a.ingreso_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    success(res, rows);
  } catch (err) {
    next(err);
  }
};
