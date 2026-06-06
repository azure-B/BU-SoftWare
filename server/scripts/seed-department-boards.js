/**
 * 학과별 boards(멘토링·팀프로젝트·학과게시판) 생성 + 학과당 샘플 게시글 6건
 *
 * 선행: migrate-department-boards.sql 또는 seed-department-boards-full.sql
 *   - DATABASE_URL 없음 → Supabase SQL Editor에서 seed-department-boards-full.sql 한 번 실행
 *   - DATABASE_URL 있음 → node scripts/apply-department-boards-full.js
 * 실행(마이그레이션 후): node scripts/seed-department-boards.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getServerClient } = require('../src/config/supabase');

const SQL_FILE = path.join(__dirname, 'migrate-department-boards.sql');
const DB_URL =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

const DEPARTMENT_BOARD_KINDS = [
  { kind: 'mentoring', label: '멘토링', category: 'university' },
  { kind: 'team', label: '팀프로젝트', category: 'university' },
  { kind: 'dept_board', label: '학과 게시판', category: 'department' },
];

function buildPostsForDepartment(deptName) {
  const short = deptName.replace(/학부$|학과$|대학$/, '');
  return [
    {
      kind: 'mentoring',
      title: `[${deptName}] 전공·진로 멘토링 스터디 모집`,
      content: `${deptName} 재학생 대상 전공·진로 멘토링 스터디를 모집합니다.\n\n■ 대상: ${deptName} 1~3학년\n■ 방식: 주 1회 온라인 + 격주 오프라인\n■ 주제: 전공 로드맵, 포트폴리오, 자격증 준비\n관심 있으신 분은 댓글로 연락처를 남겨 주세요.`,
    },
    {
      kind: 'mentoring',
      title: `${short} 전공 선배 멘토 구합니다`,
      content: `${deptName}에 재학 중인 후배입니다. 전공 수강·졸업요건·현장실습 관련 조언을 구합니다.\n가능하신 선배님께서는 편하게 댓글 남겨 주시면 감사하겠습니다.`,
    },
    {
      kind: 'team',
      title: `[${deptName}] 팀플·조별과제 팀원 모집`,
      content: `${deptName} 수강생 대상 팀 프로젝트 팀원을 모집합니다.\n\n■ 인원: 2명 추가 모집\n■ 과목: 전공·교양 팀플 모두 가능\n■ 미팅: 주 1회 저녁, 천안 캠퍼스 기준\n함께할 분 연락 부탁드립니다.`,
    },
    {
      kind: 'team',
      title: `${deptName} 졸업작품·캡스톤 팀원 구해요`,
      content: `${deptName} 졸업작품(캡스톤) 프로젝트 팀원을 찾습니다.\n\n■ 분야: ${short} 관련 주제\n■ 역할: 기획·개발·디자인 중 1\n■ 일정: 학기 중 주 2회 미팅\n관심 있으시면 제목/경험 간단히 남겨 주세요.`,
    },
    {
      kind: 'dept_board',
      title: `[${deptName}] 2026-1학기 학과 공지`,
      content: `${deptName} 2026학년도 1학기 주요 일정을 안내합니다.\n\n■ OT: 3월 첫째 주 (강의실 추후 공지)\n■ 사물함·실습실 신청: 학과 사무실 방문\n■ 지도교수 상담: 수강신청 전 필수\n문의는 학과 사무실로 연락 바랍니다.`,
    },
    {
      kind: 'dept_board',
      title: `${deptName} 수강·학사 Q&A`,
      content: `${deptName} 재학생 학사 관련 자주 묻는 질문을 정리합니다.\n\n- 전공선택 변경: 수강신청 정정 기간 내 포털 신청\n- 병결·공결: 학과 사무실 서류 제출\n- 현장실습: 3학년 대상 별도 공지 예정\n추가 질문은 댓글로 남겨 주세요.`,
    },
  ];
}

async function applyMigrationIfPossible() {
  if (!DB_URL) {
    console.warn('DATABASE_URL 없음 — migrate-department-boards.sql을 SQL Editor에서 실행했는지 확인하세요.');
    return false;
  }

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('Applied migrate-department-boards.sql');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`DDL 자동 적용 실패: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function columnsReady(supabase) {
  const { error } = await supabase.from('boards').select('department_id, board_kind').limit(1);
  return !error;
}

async function resolveAuthorForDepartment(supabase, departmentId, fallbackUserId) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('department_id', departmentId)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? fallbackUserId;
}

async function ensureDepartmentBoard(supabase, department, spec) {
  const { data: existing, error: fetchError } = await supabase
    .from('boards')
    .select('id, name')
    .eq('department_id', department.id)
    .eq('board_kind', spec.kind)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (existing) return existing;

  const name = `${department.name} ${spec.label}`;
  const { data, error } = await supabase
    .from('boards')
    .insert({
      name,
      category: spec.category,
      department_id: department.id,
      board_kind: spec.kind,
    })
    .select('id, name')
    .single();

  if (error) throw new Error(`board insert (${name}): ${error.message}`);
  return data;
}

async function seedPostsForBoard(supabase, boardId, posts, authorId) {
  const { data: existing } = await supabase
    .from('posts')
    .select('title')
    .eq('board_id', boardId);

  const existingTitles = new Set((existing ?? []).map((row) => row.title));
  const toInsert = posts
    .filter((post) => !existingTitles.has(post.title))
    .map((post) => ({
      board_id: boardId,
      user_id: authorId,
      title: post.title,
      content: post.content,
    }));

  if (!toInsert.length) return 0;

  const { data, error } = await supabase.from('posts').insert(toInsert).select('id, title');
  if (error) throw new Error(`posts insert (board ${boardId}): ${error.message}`);
  return data.length;
}

async function run() {
  await applyMigrationIfPossible();

  const supabase = getServerClient();
  if (!(await columnsReady(supabase))) {
    throw new Error(
      'boards.department_id / board_kind 컬럼이 없습니다.\n' +
        'Supabase SQL Editor에서 server/scripts/seed-department-boards-full.sql 을 실행하거나,\n' +
        'DATABASE_URL 설정 후 node scripts/apply-department-boards-full.js 를 실행하세요.',
    );
  }

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .order('id');

  if (deptError) throw new Error(deptError.message);
  if (!departments?.length) throw new Error('departments 테이블이 비어 있습니다.');

  const { data: fallbackUser } = await supabase
    .from('users')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!fallbackUser?.id) throw new Error('users 테이블에 작성자가 없습니다.');

  let boardsCreated = 0;
  let postsInserted = 0;

  for (const department of departments) {
    const boardByKind = {};
    for (const spec of DEPARTMENT_BOARD_KINDS) {
      const before = await supabase
        .from('boards')
        .select('id')
        .eq('department_id', department.id)
        .eq('board_kind', spec.kind)
        .maybeSingle();

      const board = await ensureDepartmentBoard(supabase, department, spec);
      boardByKind[spec.kind] = board.id;
      if (!before.data) boardsCreated += 1;
    }

    const authorId = await resolveAuthorForDepartment(
      supabase,
      department.id,
      fallbackUser.id,
    );
    const templates = buildPostsForDepartment(department.name);

    for (const template of templates) {
      const boardId = boardByKind[template.kind];
      const count = await seedPostsForBoard(supabase, boardId, [template], authorId);
      postsInserted += count;
    }

    console.log(`  ${department.name}: boards ok, +${templates.length} posts checked`);
  }

  console.log(`\nDone. New boards: ~${boardsCreated}, new posts inserted: ${postsInserted}`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
