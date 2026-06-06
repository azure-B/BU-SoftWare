/**
 * courses · graduation_check 스키마 확장 + 기존 과목 ge/major 메타 백필
 *
 * DATABASE_URL(또는 SUPABASE_DB_URL)이 .env에 있으면 자동 실행.
 * 없으면 Supabase SQL Editor에서 scripts/migrate-all-academic.sql 실행.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getServerClient } = require('../src/config/supabase');

const SQL_FILE = path.join(__dirname, 'migrate-all-academic.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

const pool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

const MAJOR_META = {
  프로그래밍기초: 'basic',
  컴퓨터공학개론: 'basic',
  자료구조: 'core',
  알고리즘: 'core',
  운영체제: 'core',
  데이터베이스: 'depth',
  컴퓨터네트워크: 'depth',
  컴파일러설계: 'depth',
  소프트웨어공학: 'applied',
  인공지능기초: 'applied',
};

const LIBERAL_META = {
  '채플과섬김 I': { ge_area: '백석', ge_subject: '채플과섬김' },
  '채플과섬김 II': { ge_area: '백석', ge_subject: '채플과섬김' },
  '사랑의실천 I': { ge_area: '백석', ge_subject: '사랑의실천' },
  '사랑의실천 II': { ge_area: '백석', ge_subject: '사랑의실천' },
  '글로벌역량 I': { ge_area: '기초', ge_subject: '글로벌역량' },
  '글로벌역량 II': { ge_area: '기초', ge_subject: '글로벌역량' },
  정보통신개론: { ge_area: '기초', ge_subject: '정보통신' },
  디지털리터러시: { ge_area: '기초', ge_subject: '정보통신' },
  '맞춤형글쓰기 I': { ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  '맞춤형글쓰기 II': { ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  '과학과 토론 I': { ge_area: '기초', ge_subject: '과학과 토론' },
  '과학과 토론 II': { ge_area: '기초', ge_subject: '과학과 토론' },
  '균형-인간문화이해 I': { ge_area: '심화', ge_subject: '균형-인간문화이해' },
  '균형-인간문화이해 II': { ge_area: '심화', ge_subject: '균형-인간문화이해' },
  '균형-사회역사이해': { ge_area: '심화', ge_subject: '균형-사회역사이해' },
  '균형-자연과학기술이해': { ge_area: '심화', ge_subject: '균형-자연과학기술이해' },
  '균형-예술체육이해 I': { ge_area: '심화', ge_subject: '균형-예술체육이해' },
  '균형-예술체육이해 II': { ge_area: '심화', ge_subject: '균형-예술체육이해' },
  '사고와 문제해결 I': { ge_area: '심화', ge_subject: '사고와 문제해결' },
  '사고와 문제해결 II': { ge_area: '심화', ge_subject: '사고와 문제해결' },
};

async function columnsReady(supabase) {
  const { error } = await supabase.from('courses').select('ge_area, ge_subject, major_track').limit(1);
  return !error;
}

async function runSqlMigration() {
  if (!pool) return false;

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Applied migrate-all-academic.sql via DATABASE_URL.');
    return true;
  } finally {
    client.release();
  }
}

async function backfillCourseMeta(supabase) {
  const { data: courses, error } = await supabase.from('courses').select('id, name, type');

  if (error) {
    throw new Error(`courses 조회 실패: ${error.message}`);
  }

  let updated = 0;

  for (const course of courses ?? []) {
    let patch = null;

    if (course.type === 'major_required' && MAJOR_META[course.name]) {
      patch = { major_track: MAJOR_META[course.name], ge_area: null, ge_subject: null };
    } else if (course.type === 'liberal_required' && LIBERAL_META[course.name]) {
      patch = LIBERAL_META[course.name];
    }

    if (!patch) continue;

    const { error: updateError } = await supabase.from('courses').update(patch).eq('id', course.id);

    if (updateError) {
      throw new Error(`${course.name} 백필 실패: ${updateError.message}`);
    }

    updated += 1;
  }

  console.log(`Backfilled ge/major metadata on ${updated} course(s).`);
}

async function run() {
  const supabase = getServerClient();

  const migrated = await runSqlMigration();
  if (!migrated) {
    const ready = await columnsReady(supabase);
    if (!ready) {
      console.log(
        'DATABASE_URL이 없어 DDL을 자동 실행할 수 없습니다.\n' +
          'Supabase Dashboard → SQL Editor에서 server/scripts/migrate-all-academic.sql 을 실행하세요.',
      );
      process.exitCode = 1;
      return;
    }
  }

  if (!(await columnsReady(supabase))) {
    throw new Error('마이그레이션 후에도 ge_area 컬럼을 찾을 수 없습니다.');
  }

  await backfillCourseMeta(supabase);
  console.log('Academic schema migration complete.');
}

run()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    if (pool) await pool.end().catch(() => {});
  });
