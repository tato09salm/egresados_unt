const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno del primer módulo
const envPath = path.join(__dirname, 'modulo-1-registro', 'backend', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ No se encontró el archivo .env en modulo-1-registro/backend');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createStivenAdmin() {
  const client = await pool.connect();
  try {
    const username = 'stiven';
    const password = 'stiven';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log(`🚀 Creando usuario administrador '${username}'...`);

    await client.query('BEGIN');

    // 1. Crear persona si no existe
    const personaId = 'c1000000-0000-0000-0000-000000000002'; // ID fijo para stiven
    await client.query(
      `INSERT INTO egresados_unt.personas (id_persona, tipo_doc, num_doc, nombres, apellidos, email) 
       VALUES ($1, 'DNI', '12345678', 'Stiven', 'Admin', 'stiven@sge.unt.edu.pe')
       ON CONFLICT (id_persona) DO NOTHING`,
      [personaId]
    );

    // 2. Crear usuario administrador
    const res = await client.query(
      `INSERT INTO egresados_unt.usuarios (id_persona, username, password_hash, rol) 
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (username) DO UPDATE SET password_hash = $3
       RETURNING id_usuario`,
      [personaId, username, hash]
    );

    await client.query('COMMIT');

    if (res.rows.length > 0) {
      console.log(`✅ Usuario '${username}' creado/actualizado exitosamente.`);
      console.log(`🔑 Username: ${username}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`🛡️  Rol: admin`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Error al crear el usuario:`, err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createStivenAdmin();
