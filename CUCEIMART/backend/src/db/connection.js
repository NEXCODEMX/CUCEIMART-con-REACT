// src/db/connection.js
// CUCEI MART - Conexion a PostgreSQL | NEXCODE

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'cuceimart',
  user:     process.env.DB_USER     || 'cuceimart_admin',
  password: process.env.DB_PASSWORD || 'CambiarPasswordAdmin123!',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[DB] Conexion establecida con PostgreSQL - CUCEI MART');
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool de conexiones:', err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Query ejecutado en ${duration}ms | Filas: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error('[DB] Error en query:', err.message);
    throw err;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
