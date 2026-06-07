const BoardModel = require('../models/boardModel');
const { getDepartmentFilterIds } = require('./departmentScope');

function isGlobalBoard(boardMeta) {
  if (!boardMeta?.board_kind) return false;
  return boardMeta.department_id == null && BoardModel.GLOBAL_BOARD_KINDS.has(boardMeta.board_kind);
}

function isPublicReadableBoard(boardMeta) {
  if (!boardMeta) return false;
  if (boardMeta.category === 'campus_tour') return true;
  return isGlobalBoard(boardMeta);
}

function canAccessDepartmentBoard(boardDepartmentId, { requestDepartmentId, userDepartmentId }) {
  if (boardDepartmentId == null) return true;

  const requestIds = getDepartmentFilterIds(requestDepartmentId);
  if (requestIds?.includes(boardDepartmentId)) return true;

  const userIds = getDepartmentFilterIds(userDepartmentId);
  if (userIds?.includes(boardDepartmentId)) return true;

  return false;
}

async function fetchUserDepartmentId(supabase, userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('department_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    const err = new Error('사용자 정보를 확인하지 못했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  return data?.department_id ?? null;
}

async function assertReadableBoard(supabase, boardMeta, accessContext = {}) {
  if (!boardMeta) {
    const err = new Error('게시판을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }

  if (isPublicReadableBoard(boardMeta)) return;

  const userDepartmentId =
    accessContext.userDepartmentId ??
    (accessContext.userId
      ? await fetchUserDepartmentId(supabase, accessContext.userId)
      : null);

  if (
    canAccessDepartmentBoard(boardMeta.department_id, {
      requestDepartmentId: accessContext.departmentId,
      userDepartmentId,
    })
  ) {
    return;
  }

  const err = new Error('게시글을 조회할 권한이 없습니다.');
  err.status = 403;
  throw err;
}

async function assertReadablePostById(supabase, postId, accessContext = {}) {
  const id = Number(postId);
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, board_id, boards ( board_kind, department_id, category )')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    const err = new Error('게시글 조회에 실패했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  if (!post) {
    const err = new Error('게시글을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }

  await assertReadableBoard(supabase, post.boards, accessContext);
  return post;
}

module.exports = {
  isGlobalBoard,
  isPublicReadableBoard,
  canAccessDepartmentBoard,
  assertReadableBoard,
  assertReadablePostById,
  fetchUserDepartmentId,
};
