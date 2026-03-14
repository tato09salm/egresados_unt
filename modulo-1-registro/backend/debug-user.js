const db = require('./config/database');

async function debugUser(username) {
  try {
    const res = await db.query(
      `SELECT u.username, u.id_persona as user_p, e.id_persona as egre_p, e.id_egresado
       FROM egresados_unt.usuarios u 
       LEFT JOIN egresados_unt.egresados e ON e.id_persona = u.id_persona 
       WHERE u.username = $1`,
      [username]
    );
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugUser(process.argv[2] || 'egresa1');
