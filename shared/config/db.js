const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'egresados_unt',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'sa',
  max:      10,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log(`✅ Conectado a PostgreSQL: ${process.env.DB_NAME || 'egresados_unt'}`);
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err.message);
});

// Ejecutar una query con parámetros
const query = (text, params) => pool.query(text, params);

// Obtener un cliente para transacciones
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
