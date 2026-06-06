require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getServerClient } = require('../src/config/supabase');
const TourModel = require('../src/models/tourModel');
const { CAMPUS_TOUR_BOARD_CATEGORY } = require('../src/utils/tourConstants');

const SQL_FILE = path.join(__dirname, 'migrate-campus-tour.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

const pool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

async function runMigrationSql() {
  if (!pool) {
    console.warn('DATABASE_URL 없음 — migrate-campus-tour.sql을 Supabase SQL Editor에서 실행하세요.');
    return false;
  }

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('migrate-campus-tour.sql 적용 완료');
    return true;
  } finally {
    client.release();
  }
}

async function schemaReady(supabase) {
  const { error: placeError } = await supabase.from('campus_places').select('board_id').limit(1);
  if (placeError) {
    return { ready: false, reason: placeError.message };
  }

  const probeName = `__campus_tour_probe_${Date.now()}`;
  const { data: probe, error: boardError } = await supabase
    .from('boards')
    .insert({ name: probeName, category: CAMPUS_TOUR_BOARD_CATEGORY })
    .select('id')
    .single();

  if (boardError) {
    return { ready: false, reason: boardError.message };
  }

  await supabase.from('boards').delete().eq('id', probe.id);
  return { ready: true };
}

async function run() {
  const supabase = getServerClient();
  const migrated = await runMigrationSql();

  const ready = await schemaReady(supabase);
  if (!ready.ready) {
    console.error('\n[campus_tour] DB 스키마가 준비되지 않았습니다.');
    console.error(`원인: ${ready.reason}`);
    if (!migrated) {
      console.error(
        '\nSupabase Dashboard → SQL Editor에서 아래 파일을 실행하세요:\n' +
          '  server/scripts/migrate-campus-tour.sql\n',
      );
    }
    process.exit(1);
  }

  const result = await TourModel.syncRestaurantsFromKakao();
  console.log(
    `Kakao 검색 ${result.searched}건 · 신규 게시판 ${result.createdBoards} · 신규 장소 ${result.createdPlaces} · 갱신 ${result.updatedPlaces}`,
  );

  const { places } = await TourModel.findPlaces();
  console.log(`campus_tour 음식점 게시판 ${places.length}개 준비됨 (500m 이내)`);
  for (const place of places.slice(0, 5)) {
    console.log(`  - ${place.name} (board ${place.boardId}, ${place.distanceM}m)`);
  }
  if (places.length > 5) console.log(`  ... 외 ${places.length - 5}곳`);
}

run()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    if (pool) await pool.end();
  });
