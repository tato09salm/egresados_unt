const db = require('./config/database');

async function findInconsistentUsers() {
  try {
    const result = await db.query(
      `SELECT u.username, u.rol, p.id_persona, p.nombres, p.apellidos
       FROM egresados_unt.usuarios u
       JOIN egresados_unt.personas p ON p.id_persona = u.id_persona
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona
       WHERE u.rol = 'egresado' AND e.id_egresado IS NULL`
    );
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findInconsistentUsers();
