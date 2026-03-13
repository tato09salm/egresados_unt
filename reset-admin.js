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

async function resetAdmin() {
  try {
    const password = 'Admin2024!';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log(`🚀 Reseteando contraseña para el usuario 'admin'...`);
    
    const res = await pool.query(
      "UPDATE egresados_unt.usuarios SET password_hash = $1 WHERE username = 'admin' RETURNING id_usuario",
      [hash]
    );

    if (res.rows.length > 0) {
      console.log(`✅ Contraseña de 'admin' actualizada exitosamente.`);
      console.log(`🔑 Username: admin`);
      console.log(`🔑 Password: ${password}`);
    } else {
      console.error(`❌ No se encontró el usuario 'admin' en la tabla egresados_unt.usuarios.`);
    }
  } catch (err) {
    console.error(`❌ Error al actualizar la contraseña:`, err.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
