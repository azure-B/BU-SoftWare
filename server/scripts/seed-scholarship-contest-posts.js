require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { getServerClient } = require('../src/config/supabase');

const SCHOLARSHIP_BOARD_ID = 1;
const CONTEST_BOARD_ID = 2;
const POSTS_PER_BOARD = 10;
const SEED_PASSWORD = '12341234';

const SCHOLARSHIP_TEMPLATES = [
  {
    titleSuffix: '2026-1학기 학과 추천 장학금 모집',
    content: (dept) => `${dept} 재학생 대상 학과 추천 장학금을 아래와 같이 모집합니다.

■ 대상: ${dept} 재학생 (직전 학기 15학점 이상 이수, 평점 3.5 이상)
■ 선발 인원: 3명
■ 지원 기간: 2026.03.10(월) ~ 03.21(금) 17:00
■ 제출 서류: 장학금 신청서, 성적증명서, 자기소개서(1페이지)
■ 제출처: ${dept} 학과 사무실
■ 결과 발표: 2026.03.28(금) 학과 게시판

문의: ${dept} 학과 사무실`,
  },
  {
    titleSuffix: '성적우수 장학금 추가 선발 안내',
    content: (dept) => `${dept} 성적우수 장학금 추가 선발 안내입니다.

■ 대상: 2025학년도 2학기 GPA 4.0 이상 재학생
■ 선발 인원: 2명
■ 신청: 2026.03.05(수) ~ 03.12(수)
■ 제출: 성적증명서, 장학금 신청서(학과 양식)
■ 지급: 2026.04월 중 등록금 선감면

※ 타 장학금과 중복 수혜 여부는 학과 사무실에서 확인해 주세요.`,
  },
  {
    titleSuffix: '근로장학금 학과 배정 안내',
    content: (dept) => `${dept} 소속 근로장학금 배정 안내입니다.

■ 배정 부서: ${dept} 행정실·연구실
■ 근무 시간: 주 10~15시간 (학기 중)
■ 신청 기간: 2026.02.24(월) ~ 03.07(금)
■ 신청 방법: 종합정보시스템 근로장학 신청 후 학과 확인서 제출
■ 면접: 2026.03.10(월) ~ 03.14(금) (개별 연락)

근무 가능 시간표를 반드시 첨부해 주세요.`,
  },
  {
    titleSuffix: '저소득층 국가장학금 서류 제출 안내',
    content: (dept) => `${dept} 재학생 대상 국가장학금(1·2유형) 서류 제출을 안내합니다.

■ 대상: ${dept} 재학생 중 국가장학금 신청자
■ 제출 기간: 2026.03.17(월) ~ 03.28(금)
■ 제출 서류: 가구원 정보 동의서, 소득·재산 증빙(해당자)
■ 제출처: ${dept} 학과 사무실 또는 학생지원팀
■ 유의: 기한 내 미제출 시 심사에서 제외될 수 있습니다.

학과 사무실 방문 전 전화 예약을 권장합니다.`,
  },
  {
    titleSuffix: '교내 장학재단 지정 장학금 안내',
    content: (dept) => `교내 장학재단 지정 장학금(${dept} 배정분) 안내입니다.

■ 대상: ${dept} 재학생
■ 선발 인원: 5명
■ 지원 기간: 2026.04.01(화) ~ 04.11(금)
■ 심사: 서류 70% + 학과 추천 30%
■ 제출: 신청서, 성적증명서, 추천서(지도교수)

결과는 2026.04.25(금) 개별 통보 예정입니다.`,
  },
  {
    titleSuffix: '현장실습·봉사 장학금 신청 안내',
    content: (dept) => `${dept} 현장실습·봉사 활동 장학금 신청 안내입니다.

■ 대상: 2025.09 ~ 2026.02 현장실습·봉사 60시간 이상 이수자
■ 지원 기간: 2026.03.03(월) ~ 03.14(금)
■ 제출: 활동 확인서, 활동 보고서, 장학금 신청서
■ 지급액: 활동 유형별 차등 (최대 100만 원)

활동 증빙은 원본 또는 학과 확인 날인본을 제출해 주세요.`,
  },
  {
    titleSuffix: '입학 장학금 유지 요건 안내',
    content: (dept) => `${dept} 입학 장학금 수혜자 유지 요건 안내입니다.

■ 유지 조건: 직전 학기 평점 3.0 이상, 15학점 이상 이수
■ 확인 시기: 매 학기 초 (2026-1학기: 3월 4째 주)
■ 미충족 시: 차기 학기 장학금 지급 중단
■ 이의 신청: 학과 사무실 접수 (성적 정정·의료 사유 등)

유지 요건 충족 여부는 종합정보시스템에서도 확인할 수 있습니다.`,
  },
  {
    titleSuffix: '해외 교류 장학금(학과 추천) 모집',
    content: (dept) => `${dept} 해외 교류 프로그램 연계 장학금 모집입니다.

■ 대상: ${dept} 2학년 이상, TOEIC 700+ 또는 동등 어학 성적
■ 선발 인원: 2명
■ 지원 기간: 2026.03.24(월) ~ 04.04(금)
■ 제출: 신청서, 성적·어학 증명, 학업 계획서(영문)
■ 면접: 2026.04.14(화) (개별 안내)

선발자는 2026-2학기 교환·복수학위 프로그램 우선 추천 대상입니다.`,
  },
  {
    titleSuffix: '재학생 특별 장학금(재난·경제) 신청',
    content: (dept) => `${dept} 재학생 특별 장학금(경제적 어려움) 신청 안내입니다.

■ 대상: ${dept} 재학생 중 경제적 어려움 입증 가능자
■ 지원 기간: 상시 접수 (학기 중 매월 1~15일 집중 심사)
■ 제출: 신청서, 사유서, 증빙 서류(해당자)
■ 심사: 학과 장학위원회 월 1회
■ 지급: 심사 후 2주 이내

개인정보는 장학 심사 목적으로만 사용됩니다.`,
  },
  {
    titleSuffix: '2026-1학기 장학금 수혜자 명단 공지',
    content: (dept) => `${dept} 2026-1학기 장학금 1차 수혜자 명단을 공지합니다.

■ 공지 대상: 학과 추천·성적우수·근로 장학금 1차 선발자
■ 명단 확인: ${dept} 학과 게시판 첨부 PDF 또는 학과 사무실 방문
■ 이의 제기: 공지일로부터 7일 이내 학과 사무실 서면 접수
■ 2차 선발: 2026.04월 중 공지 예정

개인정보 보호를 위해 온라인 게시판에는 학번 일부만 표기됩니다.`,
  },
];

const CONTEST_TEMPLATES = [
  {
    titleSuffix: '2026 학과 학술·실무 경진대회',
    content: (dept) => `${dept} 주관 2026 학술·실무 경진대회 참가 안내입니다.

■ 대회 일시: 2026.05.08(금) 13:00 ~ 17:00
■ 장소: ${dept} 세미나실 및 지정 강의실
■ 참가 대상: ${dept} 재학생 (팀당 2~4명)
■ 접수 기간: 2026.03.17(월) ~ 04.11(금)
■ 접수 방법: 참가 신청서 + 발표 개요(1페이지) 학과 사무실 제출
■ 시상: 대상 1팀, 우수상 2팀 (상장 및 상품)

문의: ${dept} 학과 사무실`,
  },
  {
    titleSuffix: '교내 해커톤 참가 모집',
    content: (dept) => `2026 백석대학교 교내 해커톤 ${dept} 참가팀 모집입니다.

■ 대회 일시: 2026.04.18(토) ~ 04.19(일) 24시간
■ 장소: 창업지원단 코워킹 스페이스
■ 모집: ${dept} 재학생 3~5명 1팀
■ 접수: 2026.03.10(월) ~ 03.28(금) (학과 사무실)
■ 제공: 멘토링, 식사, 우수팀 시상

팀장 1명이 학과에 팀원 명단과 함께 접수해 주세요.`,
  },
  {
    titleSuffix: '전공 분야 아이디어 공모전',
    content: (dept) => `${dept} 전공 연계 아이디어 공모전 안내입니다.

■ 주제: ${dept} 전공과 연계된 실용·창의 아이디어
■ 참가 형식: 개인 또는 팀(최대 3명)
■ 접수 기간: 2026.03.03(월) ~ 03.31(월)
■ 제출: 기획서(A4 5페이지 이내), PPT 요약(10장)
■ 심사: 2026.04.08(수) 발표 심사

수상팀은 학과 축제 부스 운영 우선 지원 대상입니다.`,
  },
  {
    titleSuffix: '대외 공모전(학과 추천) 참가 안내',
    content: (dept) => `전국 ${dept} 관련 대외 공모전 학과 추천 참가 안내입니다.

■ 공모전: 2026 전국 대학생 ${dept.replace(/학부|학과|대학/g, '')} 분야 공모전
■ 참가 자격: ${dept} 재학생
■ 학과 추천 접수: 2026.03.24(월) ~ 04.07(월)
■ 제출: 참가 신청서, 작품·논문 초록(양식 준수)
■ 지원: 교통비·등록비 일부 학과 지원 (예산 범위 내)

추천 팀은 지도교수 1명이 배정됩니다.`,
  },
  {
    titleSuffix: '캡스톤·졸업작품 경진대회',
    content: (dept) => `${dept} 캡스톤·졸업작품 경진대회 일정 안내입니다.

■ 예선: 2026.05.20(수) ~ 05.22(금)
■ 본선: 2026.06.03(수) 대강당
■ 참가: ${dept} 4학년 캡스톤·졸업작품 팀
■ 제출: 최종 보고서, 시연 영상(3분), 포스터
■ 시상: 최우수작, 우수작, 인기상

팀별 발표 순서는 5.15(금) 공지 예정입니다.`,
  },
  {
    titleSuffix: '창업 아이디어 경진대회 참가',
    content: (dept) => `${dept} 재학생 대상 창업 아이디어 경진대회입니다.

■ 일시: 2026.04.25(토) 10:00 ~ 16:00
■ 장소: 창업지원단 세미나실
■ 참가: ${dept} 재학생 (팀당 2~4명)
■ 접수: 2026.03.05(수) ~ 04.04(금)
■ 제출: 사업계획서 요약(5페이지), IR 피치(5분)

입상팀은 창업지원단 멘토링 프로그램 우선 선정됩니다.`,
  },
  {
    titleSuffix: '영어·발표 경시대회',
    content: (dept) => `${dept} 영어 발표 경시대회 안내입니다.

■ 일시: 2026.04.14(화) 14:00 ~
■ 장소: ${dept} 지정 강의실
■ 대상: ${dept} 재학생 (개인)
■ 접수: 2026.03.12(수) ~ 03.28(금)
■ 발표: 5분 + 질의 2분 (영어)
■ 시상: 1·2·3위 및 장려상

원고 및 슬라이드는 접수 마감 3일 전까지 제출해 주세요.`,
  },
  {
    titleSuffix: '학과 체육대회·e스포츠 대회',
    content: (dept) => `${dept} 연합 체육·e스포츠 대회 참가 안내입니다.

■ 일시: 2026.05.15(금) 10:00 ~ 18:00
■ 장소: 체육관·학생회관 e스포츠룸
■ 종목: 축구, 농구, 배드minton, e스포츠(리그 오브 레전드)
■ 접수: 2026.04.01(화) ~ 04.18(금)
■ 참가: ${dept} 재학생 (종목별 팀 등록)

우승팀에게는 학과 상패와 기념품이 수여됩니다.`,
  },
  {
    titleSuffix: '논문·포스터 발표 대회',
    content: (dept) => `${dept} 학부생 논문·포스터 발표 대회입니다.

■ 일시: 2026.05.29(금) 13:00 ~ 17:00
■ 장소: ${dept} 및 공학관 로비
■ 참가: ${dept} 3·4학년 (지도교수 승인 필수)
■ 접수: 2026.04.07(월) ~ 05.02(금)
■ 제출: 초록, 포스터 또는 슬라이드

우수 발표자는 교내 학술제 출전 추천 대상입니다.`,
  },
  {
    titleSuffix: '2026 여름 방학 공모·대회 통합 안내',
    content: (dept) => `${dept} 2026 여름 방학 기간 참가 가능 대회·공모전 통합 안내입니다.

■ 대상: ${dept} 재학생
■ 안내 내용: 교내·교외 공모전 일정, 학과 지원 가능 항목
■ 설명회: 2026.06.05(금) 15:00 ${dept} 세미나실
■ 자료: 학과 게시판 PDF 다운로드
■ 문의: ${dept} 학과 사무실

설명회 참석자에게 지원 서류 양식을 배포합니다.`,
  },
];

function buildTitle(deptName, suffix) {
  return `[${deptName}] ${suffix}`;
}

function studentIdForDepartment(departmentId) {
  return `9${String(departmentId).padStart(9, '0')}`;
}

async function loadDepartments(supabase) {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('id', { ascending: true });

  if (error) throw new Error(`departments fetch: ${error.message}`);

  const rows = (data ?? []).filter((row) => row.name && row.name.trim());
  if (rows.length < POSTS_PER_BOARD) {
    throw new Error(
      `학과가 ${rows.length}개뿐입니다. seed-departments.js 실행 후 다시 시도해 주세요.`,
    );
  }

  return rows.slice(0, POSTS_PER_BOARD);
}

async function ensureAuthorForDepartment(supabase, department) {
  const studentId = studentIdForDepartment(department.id);
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10);

  const { data: existing } = await supabase
    .from('users')
    .select('id, student_id, department_id')
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.department_id !== department.id) {
      const { error } = await supabase
        .from('users')
        .update({ department_id: department.id })
        .eq('id', existing.id);
      if (error) throw new Error(`user update (${studentId}): ${error.message}`);
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({
      department_id: department.id,
      student_id: studentId,
      password: passwordHash,
      name: `${department.name} 시드`,
    })
    .select('id')
    .single();

  if (error) throw new Error(`user insert (${department.name}): ${error.message}`);
  return created.id;
}

async function seedBoardPosts(supabase, { boardId, boardLabel, templates, departments }) {
  const { data: existingRows, error: existingError } = await supabase
    .from('posts')
    .select('title')
    .eq('board_id', boardId);

  if (existingError) throw new Error(`${boardLabel} posts fetch: ${existingError.message}`);

  const existingTitles = new Set((existingRows ?? []).map((row) => row.title));
  const toInsert = [];

  for (let i = 0; i < POSTS_PER_BOARD; i += 1) {
    const dept = departments[i];
    const template = templates[i];
    const title = buildTitle(dept.name, template.titleSuffix);

    if (existingTitles.has(title)) continue;

    const userId = await ensureAuthorForDepartment(supabase, dept);
    const day = String(10 + i).padStart(2, '0');

    toInsert.push({
      board_id: boardId,
      user_id: userId,
      title,
      content: template.content(dept.name),
      created_at: `2026-03-${day}T0${9 + (i % 3)}:00:00+09:00`,
    });
  }

  if (toInsert.length === 0) {
    console.log(`${boardLabel}: all ${POSTS_PER_BOARD} posts already exist.`);
    return [];
  }

  const { data, error } = await supabase.from('posts').insert(toInsert).select('id, title');

  if (error) throw new Error(`${boardLabel} insert: ${error.message}`);

  console.log(`\n${boardLabel} (board ${boardId}): inserted ${data.length} posts`);
  data.forEach((row) => console.log(`  - [${row.id}] ${row.title}`));
  return data;
}

async function run() {
  const supabase = getServerClient();
  const departments = await loadDepartments(supabase);

  console.log(`Using ${departments.length} departments for seed authors:`);
  departments.forEach((dept) => console.log(`  - ${dept.id}: ${dept.name}`));

  await seedBoardPosts(supabase, {
    boardId: SCHOLARSHIP_BOARD_ID,
    boardLabel: '장학 공고',
    templates: SCHOLARSHIP_TEMPLATES,
    departments,
  });

  await seedBoardPosts(supabase, {
    boardId: CONTEST_BOARD_ID,
    boardLabel: '대회 공고',
    templates: CONTEST_TEMPLATES,
    departments,
  });
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
