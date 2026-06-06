/**
 * seed-department-boards-full.sql 실행 (DATABASE_URL 필요)
 * 없으면 SQL Editor 안내 후 종료
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SQL_FILE = path.join(__dirname, 'seed-department-boards-full.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

async function run() {
  if (!fs.existsSync(SQL_FILE)) {
    require('./generate-department-boards-sql');
  }

  if (!DB_URL) {
    console.error(
      'DATABASE_URL이 없습니다.\n' +
        'Supabase Dashboard → SQL Editor에서 아래 파일을 실행하세요:\n' +
        `  ${SQL_FILE}\n\n` +
        '또는 .env에 DATABASE_URL을 추가한 뒤 다시 실행하세요.',
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
    console.log('Applied seed-department-boards-full.sql');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
