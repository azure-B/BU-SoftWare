require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');

const DEPT_BOARD_ID = 5;

const REMOVED_TITLES = [
  '선배님들 백엔드는 스프링 vs 노드 중에 뭘로 취업 준비하나요?',
  '수강신청 백엔드 서버 프로그래밍 증원 되나요?',
  '개발용 노트북 맥북 m3 프로면 4년 버티나요?',
];

const DEPT_NOTICE_POSTS = [
  {
    title: '2026-1학기 학과 사물함 대여 안내',
    content: `컴퓨터공학과 재학생 대상 사물함 대여를 아래와 같이 안내합니다.

■ 대상: 컴퓨터공학과 재학생
■ 신청 기간: 2026.03.03(월) ~ 03.14(금) 17:00
■ 신청 방법: 학과 사무실(공학관 401호) 방문 접수
■ 준비 서류: 학생증 사본 1부, 대여 신청서(학과 홈페이지 양식)
■ 이용료: 학기당 5,000원 (현금 또는 계좌이체)
■ 배정 발표: 2026.03.17(월) 학과 게시판 및 개별 문자

※ 미납·훼손 시 차기 학기 대여가 제한될 수 있습니다.
문의: 컴퓨터공학과 사무실 (032-340-0000)`,
    created_at: '2026-02-28T00:00:00+09:00',
  },
  {
    title: '병결·공결 신청 절차 안내',
    content: `수업 결석(병결·공결) 처리를 위해 아래 절차를 준수해 주시기 바랍니다.

■ 병결: 결석일로부터 7일 이내 학과 사무실 제출
  - 병원 진료확인서 또는 진단서(원본)
  - 결석 사유서(학과 양식)
■ 공결: 행사·대회 등 학교 공적 활동 시 사전 신청
  - 지도교수 확인서, 행사 공문 또는 참가 증빙
■ 제출처: 공학관 401호 컴퓨터공학과 사무실
■ 처리: 접수 후 3~5영업일 내 종합정보시스템 반영

※ 기한 경과 시 인정이 어려울 수 있으니 반드시 기한 내 제출 바랍니다.`,
    created_at: '2026-02-25T01:30:00+09:00',
  },
  {
    title: '학과 사무실 운영 및 문의 안내',
    content: `2026학년도 컴퓨터공학과 사무실 운영 안내입니다.

■ 위치: 공학관 401호
■ 운영 시간: 평일 09:00 ~ 17:00 (점심 12:00~13:00)
■ 토·일·공휴일 휴무
■ 담당 업무: 증명서 발급, 사물함·실습실, 병결 접수, 현장실습 서류
■ 연락처: 032-340-0000 / cse-office@bu.ac.kr

방문 전 전화 문의 시 대기 시간을 줄일 수 있습니다.`,
    created_at: '2026-02-20T05:00:00+09:00',
  },
  {
    title: '전공 실습실(공학관 407호) 이용 수칙',
    content: `전공 실습실 이용과 관련하여 아래 수칙을 안내합니다.

■ 이용 대상: 컴퓨터공학과 재학생 (출입카드 등록 필수)
■ 이용 시간: 평일 08:00 ~ 22:00 (방학 중 별도 공지)
■ 금지 사항: 음식물 반입, 타인 출입카드 대여, 장비 무단 반출
■ 정리: 사용 후 콘센트·조명 OFF, 자리 정리
■ 분실·고장 발견 시 즉시 조교실 또는 학과 사무실 신고

위반 시 실습실 이용이 제한될 수 있습니다.`,
    created_at: '2026-02-18T02:00:00+09:00',
  },
  {
    title: '2026-1학기 학과 오리엔테이션 일정',
    content: `2026학년도 1학기 컴퓨터공학과 OT를 아래와 같이 실시합니다.

■ 일시: 2026.03.05(목) 14:00 ~ 16:00
■ 장소: 공학관 101호 대강당
■ 대상: 1학년 신입생 (재학생 선택 참석 가능)
■ 내용: 학과 소개, 교육과정·졸업요건, 동아리·멘토링, Q&A
■ 준비물: 학생증, 필기구

불참 시 학과 사무실로 사유서를 제출해 주세요.`,
    created_at: '2026-02-15T00:30:00+09:00',
  },
  {
    title: '캡스톤디자인 중간 점검 일정 공지',
    content: `2026학년도 캡스톤디자인 중간 점검 일정을 안내합니다.

■ 중간 발표: 2026.04.21(화) ~ 04.23(목)
■ 장소: 공학관 501~503호 (팀별 배정 추후 공지)
■ 제출: 중간 보고서(PDF) — 4.18(금) 23:59 LMS 업로드
■ 평가: 지도교수·외부 심사위원 참석, 발표 15분 + 질의 5분
■ 필수 포함: 주제, 요구사항, 설계, 진행률, 일정

팀별 발표 순서는 4.14(월) 학과 게시판에 게시됩니다.`,
    created_at: '2026-02-10T07:00:00+09:00',
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

async function run() {
  const supabase = getServerClient();
  const userId = await resolveAuthorUserId(supabase);

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('board_id', DEPT_BOARD_ID)
    .in('title', REMOVED_TITLES);

  if (deleteError) {
    console.error('delete failed:', deleteError.message);
    process.exit(1);
  }

  console.log(`Removed casual posts from board ${DEPT_BOARD_ID}`);

  const { data: existing } = await supabase
    .from('posts')
    .select('title')
    .eq('board_id', DEPT_BOARD_ID);

  const existingTitles = new Set((existing ?? []).map((row) => row.title));
  const toInsert = DEPT_NOTICE_POSTS.filter((post) => !existingTitles.has(post.title)).map(
    (post) => ({
      board_id: DEPT_BOARD_ID,
      user_id: userId,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
    }),
  );

  if (toInsert.length === 0) {
    console.log('All department notice posts already exist. Nothing to insert.');
    return;
  }

  const { data, error: insertError } = await supabase.from('posts').insert(toInsert).select('id, title');

  if (insertError) {
    console.error('insert failed:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} department notice posts (author user_id=${userId}):`);
  data.forEach((row) => console.log(`  - [${row.id}] ${row.title}`));
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
