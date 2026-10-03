const { Pool } = require('pg');

const isproduction = process.env.NODE_ENV === 'production';
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isproduction ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso');
    client.release();
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  }
}

module.exports = { pool, testConnection };
