require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const { getServerClient } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'seed-courses-full.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

const pool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

const MAJOR_COURSES = [
  { name: '프로그래밍기초', credit: 3, major_track: 'basic' },
  { name: '컴퓨터공학개론', credit: 3, major_track: 'basic' },
  { name: '자료구조', credit: 3, major_track: 'core' },
  { name: '알고리즘', credit: 3, major_track: 'core' },
  { name: '운영체제', credit: 3, major_track: 'core' },
  { name: '데이터베이스', credit: 3, major_track: 'depth' },
  { name: '컴퓨터네트워크', credit: 3, major_track: 'depth' },
  { name: '컴파일러설계', credit: 3, major_track: 'depth' },
  { name: '소프트웨어공학', credit: 3, major_track: 'applied' },
  { name: '인공지능기초', credit: 3, major_track: 'applied' },
];

const LIBERAL_COURSES = [
  { name: '채플과섬김 I', credit: 1, ge_area: '백석', ge_subject: '채플과섬김' },
  { name: '채플과섬김 II', credit: 1, ge_area: '백석', ge_subject: '채플과섬김' },
  { name: '사랑의실천 I', credit: 2, ge_area: '백석', ge_subject: '사랑의실천' },
  { name: '사랑의실천 II', credit: 2, ge_area: '백석', ge_subject: '사랑의실천' },
  { name: '글로벌역량 I', credit: 3, ge_area: '기초', ge_subject: '글로벌역량' },
  { name: '글로벌역량 II', credit: 3, ge_area: '기초', ge_subject: '글로벌역량' },
  { name: '정보통신개론', credit: 2, ge_area: '기초', ge_subject: '정보통신' },
  { name: '디지털리터러시', credit: 2, ge_area: '기초', ge_subject: '정보통신' },
  { name: '맞춤형글쓰기 I', credit: 2, ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  { name: '맞춤형글쓰기 II', credit: 2, ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  { name: '과학과 토론 I', credit: 2, ge_area: '기초', ge_subject: '과학과 토론' },
  { name: '과학과 토론 II', credit: 2, ge_area: '기초', ge_subject: '과학과 토론' },
  { name: '균형-인간문화이해 I', credit: 3, ge_area: '심화', ge_subject: '균형-인간문화이해' },
  { name: '균형-인간문화이해 II', credit: 3, ge_area: '심화', ge_subject: '균형-인간문화이해' },
  { name: '균형-사회역사이해', credit: 3, ge_area: '심화', ge_subject: '균형-사회역사이해' },
  { name: '균형-자연과학기술이해', credit: 3, ge_area: '심화', ge_subject: '균형-자연과학기술이해' },
  { name: '균형-예술체육이해 I', credit: 2, ge_area: '심화', ge_subject: '균형-예술체육이해' },
  { name: '균형-예술체육이해 II', credit: 2, ge_area: '심화', ge_subject: '균형-예술체육이해' },
  { name: '사고와 문제해결 I', credit: 3, ge_area: '심화', ge_subject: '사고와 문제해결' },
  { name: '사고와 문제해결 II', credit: 3, ge_area: '심화', ge_subject: '사고와 문제해결' },
];

async function columnsReady(supabase) {
  const { error } = await supabase.from('courses').select('ge_area, ge_subject, major_track').limit(1);
  return !error;
}

async function runSqlFile() {
  if (!pool) return false;

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    return true;
  } finally {
    client.release();
  }
}

async function ensureCourseColumns() {
  if (!pool) return false;

  await pool.query(`
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_area varchar(50);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_subject varchar(100);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS major_track varchar(50);
  `);
  return true;
}

async function run() {
  const supabase = getServerClient();

  const sqlApplied = await runSqlFile();
  if (sqlApplied) {
    console.log('Applied seed-courses-full.sql via DATABASE_URL.');
    return;
  }

  const hasExtendedColumns = await columnsReady(supabase);
  if (!hasExtendedColumns) {
    await ensureCourseColumns();
  }
  const useExtendedColumns = hasExtendedColumns || (await columnsReady(supabase));

  const { data: existing, error: fetchError } = await supabase.from('courses').select('name');

  if (fetchError) {
    throw new Error(`courses 조회 실패: ${fetchError.message}`);
  }

  const existingNames = new Set((existing ?? []).map((row) => row.name));

  const toInsert = [
    ...MAJOR_COURSES.map((course) => ({
      name: course.name,
      type: 'major_required',
      credit: course.credit,
      ...(useExtendedColumns
        ? { major_track: course.major_track, ge_area: null, ge_subject: null }
        : {}),
    })),
    ...LIBERAL_COURSES.map((course) => ({
      name: course.name,
      type: 'liberal_required',
      credit: course.credit,
      ...(useExtendedColumns
        ? { major_track: null, ge_area: course.ge_area, ge_subject: course.ge_subject }
        : {}),
    })),
  ].filter((course) => !existingNames.has(course.name));

  if (toInsert.length === 0) {
    console.log('All courses already exist. Nothing to insert.');
    return;
  }

  const { data, error: insertError } = await supabase.from('courses').insert(toInsert).select('id, name, type');

  if (insertError) {
    throw new Error(`courses insert 실패: ${insertError.message}`);
  }

  if (!useExtendedColumns) {
    console.log('Note: courses inserted with name/type/credit only (ge_area columns not present).');
  }

  const majorCount = data.filter((row) => row.type === 'major_required').length;
  const liberalCount = data.filter((row) => row.type === 'liberal_required').length;

  console.log(`Inserted ${data.length} courses (major ${majorCount}, liberal ${liberalCount}):`);
  data.forEach((row) => console.log(`  - [${row.id}] ${row.name} (${row.type})`));
}

run()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    if (pool) await pool.end().catch(() => {});
  });
