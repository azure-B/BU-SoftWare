const { getServerClient } = require('../config/supabase');
const GLOBAL_BOARD_KINDS = new Set(['scholarship', 'contest', 'dashboard_notice', 'qna']);
const DEPARTMENT_BOARD_KINDS = new Set(['mentoring', 'team', 'dept_board']);
const WRITABLE_BOARD_KINDS = new Set(['mentoring', 'team', 'qna']);

const SLUG_TO_KIND = {
  scholarship: 'scholarship',
  contest: 'contest',
  mentoring: 'mentoring',
  team: 'team',
  'dept-board': 'dept_board',
  community: null,
};

function kindToSlug(kind) {
  if (kind === 'dept_board') return 'dept-board';
  if (kind === 'dashboard_notice') return null;
  if (kind === 'campus_tour') return null;
  if (kind === 'qna') return 'qna';
  return kind;
}

function slugToKind(slug) {
  return SLUG_TO_KIND[slug] ?? null;
}

function parseBoardKindsParam(boardKind, boardKinds) {
  const raw = boardKinds
    ? String(boardKinds).split(',')
    : boardKind
      ? [String(boardKind)]
      : [];

  const kinds = raw
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value === 'dept-board' ? 'dept_board' : value));

  return [...new Set(kinds)];
}

const BoardModel = {
  GLOBAL_BOARD_KINDS,
  DEPARTMENT_BOARD_KINDS,
  WRITABLE_BOARD_KINDS,
  kindToSlug,
  slugToKind,

  findBoardMapForDepartment: async (departmentId) => {
    const supabase = getServerClient();
    const exactId = Number(departmentId);
    if (!Number.isInteger(exactId) || exactId < 1) {
      const err = new Error('유효하지 않은 학과 ID입니다.');
      err.status = 400;
      throw err;
    }

    const [{ data: globalBoards, error: globalError }, { data: deptBoards, error: deptError }] =
      await Promise.all([
        supabase
          .from('boards')
          .select('id, name, category, department_id, board_kind')
          .is('department_id', null)
          .in('board_kind', ['scholarship', 'contest', 'qna']),
        supabase
          .from('boards')
          .select('id, name, category, department_id, board_kind')
          .eq('department_id', exactId)
          .in('board_kind', ['mentoring', 'team', 'dept_board']),
      ]);

    if (globalError || deptError) {
      const err = new Error('게시판 정보를 불러오지 못했습니다.');
      err.status = 500;
      err.cause = globalError || deptError;
      throw err;
    }

    const map = {};
    for (const board of globalBoards ?? []) {
      if (board.board_kind) map[board.board_kind] = board.id;
    }

    for (const board of deptBoards ?? []) {
      if (board.board_kind) map[board.board_kind] = board.id;
    }

    return map;
  },

  resolveBoardIds: async ({ boardId, boardIds, boardKind, boardKinds, departmentId }) => {
    if (boardId || boardIds) {
      const ids = parseLegacyBoardIds(boardId, boardIds);
      if (!ids) return null;
      await validateLegacyBoardAccess(ids, departmentId);
      return ids;
    }

    const kinds = parseBoardKindsParam(boardKind, boardKinds);
    if (!kinds.length) return null;

    for (const kind of kinds) {
      if (DEPARTMENT_BOARD_KINDS.has(kind) && !departmentId) {
        const err = new Error('departmentId 쿼리가 필요합니다.');
        err.status = 400;
        throw err;
      }
    }

    const supabase = getServerClient();
    const resolved = [];

    for (const kind of kinds) {
      if (GLOBAL_BOARD_KINDS.has(kind)) {
        const { data, error } = await supabase
          .from('boards')
          .select('id')
          .eq('board_kind', kind)
          .is('department_id', null)
          .maybeSingle();

        if (error) {
          const err = new Error('게시판 정보를 불러오지 못했습니다.');
          err.status = 500;
          err.cause = error;
          throw err;
        }
        if (data?.id) resolved.push(data.id);
        continue;
      }

      if (!departmentId) continue;

      const exactId = Number(departmentId);
      const { data, error } = await supabase
        .from('boards')
        .select('id')
        .eq('board_kind', kind)
        .eq('department_id', exactId)
        .maybeSingle();

      if (error) {
        const err = new Error('게시판 정보를 불러오지 못했습니다.');
        err.status = 500;
        err.cause = error;
        throw err;
      }

      if (data?.id) resolved.push(data.id);
    }

    return resolved.length ? [...new Set(resolved)] : null;
  },

  findBoardMetaById: async (boardId) => {
    const id = Number(boardId);
    if (!Number.isInteger(id) || id < 1) return null;

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, category, department_id, board_kind')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      const err = new Error('게시판 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return data;
  },
};

function parseLegacyBoardIds(boardId, boardIds) {
  if (boardId) {
    const id = Number(boardId);
    if (!Number.isInteger(id) || id < 1) return null;
    return [id];
  }

  if (!boardIds) return null;

  const ids = String(boardIds)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);

  return ids.length > 0 ? ids : null;
}

async function validateLegacyBoardAccess(boardIds, departmentId) {
  const supabase = getServerClient();
  const { data: boards, error } = await supabase
    .from('boards')
    .select('id, department_id, board_kind')
    .in('id', boardIds);

  if (error) {
    const err = new Error('게시판 정보를 불러오지 못했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  if ((boards ?? []).length !== boardIds.length) {
    const err = new Error('존재하지 않는 게시판입니다.');
    err.status = 400;
    throw err;
  }

  for (const board of boards ?? []) {
    if (board.department_id == null) continue;

    const exactId = Number(departmentId);
    if (!Number.isInteger(exactId) || exactId !== board.department_id) {
      const err = new Error('해당 학과 게시판을 조회할 권한이 없습니다.');
      err.status = 403;
      throw err;
    }
  }
}

module.exports = BoardModel;
