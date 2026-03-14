const db = require('./config/database');

async function checkUser(usernameOrEmail) {
  try {
    const result = await db.query(
      `SELECT u.id_usuario, u.username, u.rol, p.id_persona, p.nombres, p.apellidos, e.id_egresado
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       WHERE u.username = $1 OR p.email = $1`,
      [usernameOrEmail]
    );
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Reemplaza con un usuario que esté dando problemas, por ejemplo el que usó el admin para probar
checkUser(process.argv[2] || 'admin');
