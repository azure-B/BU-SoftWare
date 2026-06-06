const { Pool } = require('pg');

/** Supabase 직접 Postgres 연결용 (선택). auth는 supabase.js 클라이언트 사용 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
