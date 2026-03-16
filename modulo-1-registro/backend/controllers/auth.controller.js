const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

const JWT_SECRET     = process.env.JWT_SECRET     || 'sge_unt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const simulateSuneduValidation = async (codigo, dni) => {
  // Simulación: Siempre valida si el código tiene 10 caracteres y el DNI 8
  if (codigo.length >= 8 && dni.length >= 8) {
    return { success: true, grado: 'Bachiller', fecha: '2023-12-15' };
  }
  return { success: false };
};

/**
 * POST /api/auth/register
 * Registra un nuevo egresado en el sistema
 */
exports.register = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
      tipo_doc, num_doc, nombres, apellidos, email, telefono, direccion,
      codigo_universitario, id_escuela, promocion, anio_ingreso, anio_egreso, anio_titulacion, promedio,
      username, password,
    } = req.body;

    // Validaciones básicas
    if (!email || !password || !nombres || !apellidos || !codigo_universitario || !id_escuela) {
      return error(res, 'Faltan campos requeridos: email, password, nombres, apellidos, codigo_universitario, id_escuela', 400);
    }

    // Verificar si el email ya existe
    const emailCheck = await client.query('SELECT id_persona FROM egresados_unt.personas WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return error(res, 'El email ya está registrado', 409);
    }

    // Verificar código universitario único
    const codigoCheck = await client.query('SELECT id_egresado FROM egresados_unt.egresados WHERE codigo_universitario = $1', [codigo_universitario]);
    if (codigoCheck.rows.length > 0) {
      return error(res, 'El código universitario ya está registrado', 409);
    }

    // Simulación de validación con SUNEDU
    const suneduValidated = await simulateSuneduValidation(codigo_universitario, num_doc);
    if (!suneduValidated.success) {
      return error(res, 'No se pudo validar el código universitario con SUNEDU', 400);
    }

    // 1. Crear persona
    const personaResult = await client.query(
      `INSERT INTO egresados_unt.personas (tipo_doc, num_doc, nombres, apellidos, email, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_persona`,
      [tipo_doc || 'DNI', num_doc || '', nombres, apellidos, email, telefono || null, direccion || null]
    );
    const id_persona = personaResult.rows[0].id_persona;

    // 2. Crear egresado
    const egresadoResult = await client.query(
      `INSERT INTO egresados_unt.egresados
         (id_persona, codigo_universitario, id_escuela, promocion, anio_ingreso, anio_egreso, anio_titulacion, promedio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_egresado`,
      [id_persona, codigo_universitario, id_escuela, promocion || null,
       anio_ingreso || null, anio_egreso || null, anio_titulacion || null, promedio || null]
    );
    const id_egresado = egresadoResult.rows[0].id_egresado;

    // 3. Crear perfil profesional vacío
    await client.query(
      'INSERT INTO egresados_unt.perfiles_profesionales (id_egresado) VALUES ($1)',
      [id_egresado]
    );

    // 4. Crear usuario
    const passwordHash = await bcrypt.hash(password, 10);
    const usernameReal = username || email.split('@')[0];

    const usuarioResult = await client.query(
      `INSERT INTO egresados_unt.usuarios (id_persona, username, password_hash, rol)
       VALUES ($1, $2, $3, 'egresado') RETURNING id_usuario, rol`,
      [id_persona, usernameReal, passwordHash]
    );
    const usuario = usuarioResult.rows[0];

    await client.query('COMMIT');

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, id_persona, id_egresado, rol: usuario.rol, username: usernameReal },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    success(res, { token, id_egresado, id_persona, rol: usuario.rol }, 'Egresado registrado exitosamente', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(`🔍 Intento de login para: ${username}`);
    
    if (!username || !password) {
      return error(res, 'Username y password son requeridos', 400);
    }

    const result = await db.query(
      `SELECT u.id_usuario, u.id_persona, u.username, u.password_hash, u.rol, u.activo,
              p.nombres, p.apellidos, p.email,
              e.id_egresado
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       WHERE u.username = $1 OR p.email = $1`,
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Usuario hallado: ${user.username}, Rol: ${user.rol}, Activo: ${user.activo}`);

      if (!user.activo) {
        return error(res, 'Cuenta desactivada. Contacte al administrador', 403);
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`🔐 Verificación de password para ${username}: ${isValid ? 'ÉXITO' : 'FALLO'}`);

      if (!isValid) {
        return error(res, 'Credenciales inválidas', 401);
      }

      await db.query('UPDATE egresados_unt.usuarios SET ultimo_login = NOW() WHERE id_usuario = $1', [user.id_usuario]);

      const token = jwt.sign(
        { id_usuario: user.id_usuario, id_persona: user.id_persona, id_egresado: user.id_egresado, rol: user.rol, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return success(res, {
        token,
        user: {
          id_usuario: user.id_usuario,
          id_egresado: user.id_egresado,
          username: user.username,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          rol: user.rol,
          es_admin: user.rol === 'admin',
          tiene_egresado: !!user.id_egresado
        }
      }, 'Login exitoso');
    }

    const empresaResult = await db.query(
      `SELECT ue.id_usuario_emp, ue.id_empresa, ue.email, ue.password_hash, ue.activo, ue.nombre,
              emp.razon_social, emp.nombre_comercial
       FROM bolsa_laboral.usuarios_empresa ue
       JOIN bolsa_laboral.empresas emp ON emp.id_empresa = ue.id_empresa
       WHERE ue.email = $1`,
      [username]
    );

    if (empresaResult.rows.length === 0) {
      console.log(`❌ Usuario no encontrado: ${username}`);
      return error(res, 'Credenciales inválidas', 401);
    }

    const empresa = empresaResult.rows[0];
    if (!empresa.activo) return error(res, 'Cuenta de empresa desactivada', 403);

    const isEmpresaValid = await bcrypt.compare(password, empresa.password_hash);
    if (!isEmpresaValid) return error(res, 'Credenciales inválidas', 401);

    await db.query('UPDATE bolsa_laboral.usuarios_empresa SET ultimo_login = NOW() WHERE id_usuario_emp = $1', [empresa.id_usuario_emp]);

    const empresaToken = jwt.sign(
      { id_usuario: empresa.id_usuario_emp, id_empresa: empresa.id_empresa, rol: 'empresa', username: empresa.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return success(res, {
      token: empresaToken,
      user: {
        id_usuario: empresa.id_usuario_emp,
        id_empresa: empresa.id_empresa,
        username: empresa.email,
        nombres: empresa.nombre || empresa.nombre_comercial || 'Empresa',
        apellidos: '',
        email: empresa.email,
        razon_social: empresa.razon_social,
        rol: 'empresa',
        es_admin: false,
        tiene_egresado: false
      }
    }, 'Login exitoso');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
exports.me = async (req, res, next) => {
  try {
    if (req.user.rol === 'empresa') {
      const empresa = await db.query(
        `SELECT ue.id_usuario_emp AS id_usuario, ue.email AS username, ue.email, ue.nombre,
                ue.cargo, ue.ultimo_login, ue.activo,
                emp.id_empresa, emp.razon_social, emp.nombre_comercial, emp.sector
         FROM bolsa_laboral.usuarios_empresa ue
         JOIN bolsa_laboral.empresas emp ON emp.id_empresa = ue.id_empresa
         WHERE ue.id_usuario_emp = $1`,
        [req.user.id_usuario]
      );
      if (empresa.rows.length === 0) return error(res, 'Usuario empresa no encontrado', 404);
      return success(res, { ...empresa.rows[0], rol: 'empresa' });
    }

    const result = await db.query(
      `SELECT u.id_usuario, u.username, u.rol, u.activo, u.ultimo_login,
              p.id_persona, p.nombres, p.apellidos, p.email, p.telefono, p.foto_url,
              e.id_egresado, e.codigo_universitario,
              es.nombre AS escuela, f.nombre AS facultad
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       LEFT JOIN egresados_unt.escuelas es ON es.id_escuela = e.id_escuela
       LEFT JOIN egresados_unt.facultades f ON f.id_facultad = es.id_facultad
       WHERE u.id_usuario = $1`,
      [req.user.id_usuario]
    );
    if (result.rows.length === 0) return error(res, 'Usuario no encontrado', 404);
    success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/usuarios/:id/cambiar-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (req.user.id_usuario !== id && req.user.rol !== 'admin') {
      return error(res, 'No tiene permiso para cambiar esta contraseña', 403);
    }

    if (!oldPassword || !newPassword) {
      return error(res, 'Se requiere la contraseña anterior y la nueva', 400);
    }

    // Buscar usuario
    const userResult = await db.query('SELECT password_hash FROM egresados_unt.usuarios WHERE id_usuario = $1', [id]);
    if (userResult.rows.length === 0) return error(res, 'Usuario no encontrado', 404);

    const user = userResult.rows[0];

    // Verificar contraseña anterior
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) return error(res, 'La contraseña actual es incorrecta', 401);

    // Hashear nueva contraseña
    const newHash = await bcrypt.hash(newPassword, 10);

    // Actualizar
    await db.query('UPDATE egresados_unt.usuarios SET password_hash = $1 WHERE id_usuario = $2', [newHash, id]);

    success(res, null, 'Contraseña actualizada exitosamente');
  } catch (err) {
    next(err);
  }
};
