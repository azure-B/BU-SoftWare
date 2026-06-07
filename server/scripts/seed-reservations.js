require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');
const { FACILITY_CATALOG } = require('../src/utils/facilityCatalog');

function todayAt(hours, minutes) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function buildTodayReservations(facilityIdsBySlug) {
  const coworking = facilityIdsBySlug.coworking;
  const meetingA = facilityIdsBySlug['meeting-a'];
  const clubRoom = facilityIdsBySlug['club-room'];

  return [
    {
      facility_id: coworking,
      start_time: todayAt(10, 0),
      end_time: todayAt(12, 0),
      status: 'CONFIRMED',
    },
    {
      facility_id: meetingA,
      start_time: todayAt(15, 0),
      end_time: todayAt(17, 0),
      status: 'PENDING',
    },
    {
      facility_id: clubRoom,
      start_time: todayAt(14, 0),
      end_time: todayAt(16, 0),
      status: 'APPROVED',
    },
  ].filter((row) => row.facility_id);
}

async function resolveUserId(supabase) {
  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('student_id', 'test')
    .maybeSingle();

  if (admin?.id) return admin.id;

  const { data: preferred } = await supabase
    .from('users')
    .select('id')
    .eq('student_id', '20240001')
    .maybeSingle();

  if (preferred?.id) return preferred.id;

  const { data: fallback } = await supabase
    .from('users')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!fallback?.id) {
    throw new Error('users 테이블에 예약 작성자로 사용할 계정이 없습니다.');
  }

  return fallback.id;
}

async function ensureFacilities(supabase) {
  const { data: existing, error: fetchError } = await supabase
    .from('facilities')
    .select('id, name')
    .order('id', { ascending: true });

  if (fetchError) {
    throw new Error(`facilities 조회 실패: ${fetchError.message}`);
  }

  const existingNames = new Set((existing ?? []).map((row) => row.name));
  const toInsert = FACILITY_CATALOG.filter((facility) => !existingNames.has(facility.name)).map(
    ({ name, location }) => ({ name, location }),
  );

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('facilities').insert(toInsert);
    if (insertError) {
      throw new Error(`facilities insert 실패: ${insertError.message}`);
    }
  }

  const { data: facilities, error: reloadError } = await supabase
    .from('facilities')
    .select('id, name')
    .in(
      'name',
      FACILITY_CATALOG.map((facility) => facility.name),
    )
    .order('id', { ascending: true });

  if (reloadError) {
    throw new Error(`facilities reload 실패: ${reloadError.message}`);
  }

  const facilityIdsBySlug = {};
  for (const definition of FACILITY_CATALOG) {
    const row = facilities.find((facility) => facility.name === definition.name);
    if (row?.id) facilityIdsBySlug[definition.slug] = row.id;
  }

  return facilityIdsBySlug;
}

async function run() {
  const supabase = getServerClient();
  const userId = await resolveUserId(supabase);
  const facilityIdsBySlug = await ensureFacilities(supabase);

  if (Object.keys(facilityIdsBySlug).length !== FACILITY_CATALOG.length) {
    throw new Error('시설 시드 데이터가 올바르게 준비되지 않았습니다.');
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  const { error: deleteError } = await supabase
    .from('reservations')
    .delete()
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString());

  if (deleteError) {
    throw new Error(`기존 오늘 예약 삭제 실패: ${deleteError.message}`);
  }

  const rows = buildTodayReservations(facilityIdsBySlug).map((row) => ({
    ...row,
    user_id: userId,
  }));

  const { data, error: insertError } = await supabase
    .from('reservations')
    .insert(rows)
    .select('id, facility_id, start_time, end_time, status');

  if (insertError) {
    throw new Error(`reservations insert 실패: ${insertError.message}`);
  }

  console.log(`Seeded ${Object.keys(facilityIdsBySlug).length} facilities`);
  console.log(`Seeded ${data.length} reservations for today (user_id=${userId}):`);
  data.forEach((row) => {
    console.log(`  - facility ${row.facility_id} ${row.start_time} ~ ${row.end_time} (${row.status})`);
  });
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
