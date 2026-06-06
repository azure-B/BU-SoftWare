require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');

const DASHBOARD_NOTICE_BOARD_ID = 100;

const DASHBOARD_NOTICE_BOARD = {
  id: DASHBOARD_NOTICE_BOARD_ID,
  name: '대시보드 중요 공지',
  category: 'university',
};

const DASHBOARD_NOTICES = [
  {
    title: '2026학년도 1학기 수강신청 일정 안내',
    content:
      '수강신청 기간은 2월 10일부터 2월 14일까지입니다. 전공 필수 과목을 우선적으로 확인하시기 바랍니다.',
    created_at: '2026-06-06T09:00:00+09:00',
  },
  {
    title: '병결 인정 사유 변경 안내',
    content:
      '6월 9일부터 병결 인정 사유가 일부 변경됩니다. 진료확인서 외 추가 증빙 서류 목록을 학과 게시판에서 확인하세요.',
    created_at: '2026-06-05T10:00:00+09:00',
  },
  {
    title: '병결 서류 제출 기한 안내',
    content: '병결은 결석일 포함 7일 이내 학과 사무실에 제출해야 합니다. 기한 경과 시 인정이 어렵습니다.',
    created_at: '2026-06-04T11:30:00+09:00',
  },
  {
    title: '대체 공휴일 수업 운영 안내',
    content: '6월 6일(현충일 대체공휴일) 휴강에 따라 6월 13일(금) 정상 수업으로 대체 운영합니다.',
    created_at: '2026-06-03T14:00:00+09:00',
  },
  {
    title: '대체 공휴일 도서관·식당 이용',
    content: '대체공휴일 당일 중앙도서관은 10:00~17:00, 학생식당은 11:30~13:30 한정 운영합니다.',
    created_at: '2026-06-02T09:00:00+09:00',
  },
];

async function resolveAuthorUserId(supabase) {
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
    throw new Error('users 테이블에 작성자로 사용할 계정이 없습니다.');
  }

  return fallback.id;
}

async function ensureDashboardNoticeBoard(supabase) {
  const { data: existing } = await supabase
    .from('boards')
    .select('id')
    .eq('id', DASHBOARD_NOTICE_BOARD_ID)
    .maybeSingle();

  if (existing?.id) return;

  const { error } = await supabase.from('boards').insert(DASHBOARD_NOTICE_BOARD);

  if (error) {
    throw new Error(`boards insert failed: ${error.message}`);
  }
}

async function run() {
  const supabase = getServerClient();
  await ensureDashboardNoticeBoard(supabase);
  const userId = await resolveAuthorUserId(supabase);

  const { data: existing } = await supabase
    .from('posts')
    .select('title')
    .eq('board_id', DASHBOARD_NOTICE_BOARD_ID);

  const existingTitles = new Set((existing ?? []).map((row) => row.title));
  const toInsert = DASHBOARD_NOTICES.filter((notice) => !existingTitles.has(notice.title)).map(
    (notice) => ({
      board_id: DASHBOARD_NOTICE_BOARD_ID,
      user_id: userId,
      title: notice.title,
      content: notice.content,
      created_at: notice.created_at,
    }),
  );

  if (toInsert.length === 0) {
    console.log('All dashboard notices already exist. Nothing to insert.');
    return;
  }

  const { data, error } = await supabase.from('posts').insert(toInsert).select('id, title');

  if (error) {
    console.error('insert failed:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} dashboard notices (board ${DASHBOARD_NOTICE_BOARD_ID}, author user_id=${userId}):`);
  data.forEach((row) => console.log(`  - [${row.id}] ${row.title}`));
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
