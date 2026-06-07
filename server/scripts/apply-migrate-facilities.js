require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

async function run() {
  if (!connectionString) {
    console.warn(
      'DATABASE_URL 없음 — Supabase SQL Editor에서 scripts/migrate-facilities-reservation.sql 을 실행하세요.',
    );
    return;
  }

  const sql = fs.readFileSync(
    path.join(__dirname, 'migrate-facilities-reservation.sql'),
    'utf8',
  );

  const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
    console.log('Applied migrate-facilities-reservation.sql');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
