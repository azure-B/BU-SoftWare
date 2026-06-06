/**
 * merge-computer-engineering-dept.sql 실행 (DATABASE_URL 필요)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SQL_FILE = path.join(__dirname, 'merge-computer-engineering-dept.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

async function run() {
  if (!DB_URL) {
    console.error(
      'DATABASE_URL이 없습니다.\n' +
        'Supabase SQL Editor에서 아래 파일을 실행하세요:\n' +
        `  ${SQL_FILE}`,
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Applied merge-computer-engineering-dept.sql');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
