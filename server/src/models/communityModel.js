const { getServerClient } = require('../config/supabase');
const { getDepartmentFilterIds } = require('../utils/departmentScope');
const { assertReadablePostById } = require('../utils/boardAccess');
const BoardModel = require('./boardModel');

const CAMPUS_TOUR_BOARD_CATEGORY = 'campus_tour';

async function assertWritableBoard(supabase, boardId, userId) {
  if (!Number.isInteger(boardId) || boardId < 1) {
    const err = new Error('유효하지 않은 게시판입니다.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('boards')
    .select('category, board_kind, department_id')
    .eq('id', boardId)
    .maybeSingle();

  if (error) {
    const err = new Error('게시판 정보를 확인하지 못했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  if (!data) {
    const err = new Error('게시판을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }

  if (data.category === CAMPUS_TOUR_BOARD_CATEGORY) return;

  if (data.board_kind && BoardModel.WRITABLE_BOARD_KINDS.has(data.board_kind)) {
    if (!data.department_id) return;

    if (data.board_kind === 'mentoring' || data.board_kind === 'team') {
      return;
    }

    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', userId)
      .maybeSingle();

    if (authorError) {
      const err = new Error('작성자 정보를 확인하지 못했습니다.');
      err.status = 500;
      err.cause = authorError;
      throw err;
    }

    const allowedDeptIds = getDepartmentFilterIds(author?.department_id) ?? [];
    if (allowedDeptIds.includes(data.department_id)) return;

    const err = new Error('소속 학과 게시판에만 글을 작성할 수 있습니다.');
    err.status = 403;
    throw err;
  }

  const err = new Error('글을 작성할 수 없는 게시판입니다.');
  err.status = 400;
  throw err;
}

const POST_USER_SELECT = 'users ( name, department_id, departments ( name ) )';
const POST_USER_INNER_SELECT = 'users!inner ( name, department_id, departments ( name ) )';

const POST_SELECT_BASE = `
  id,
  board_id,
  user_id,
  title,
  content,
  created_at,
  view_num,
  boards ( board_kind, department_id ),
  comments ( count )
`;

function buildPostSelect(departmentFilterIds) {
  const userSelect = departmentFilterIds ? POST_USER_INNER_SELECT : POST_USER_SELECT;
  return `${POST_SELECT_BASE}, ${userSelect}`;
}

const COMMENT_SELECT = `
  id,
  post_id,
  user_id,
  content,
  created_at,
  users ( name )
`;

function mapPostRow(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    boardKind: row.boards?.board_kind ?? null,
    boardDepartmentId: row.boards?.department_id ?? null,
    authorId: row.user_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    viewCount: row.view_num ?? 0,
    authorName: row.users?.name ?? '익명',
    authorDepartmentId: row.users?.department_id ?? null,
    authorDepartmentName: row.users?.departments?.name ?? null,
    commentCount: row.comments?.[0]?.count ?? 0,
  };
}

function mapCommentRow(row) {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    authorName: row.users?.name ?? '익명',
  };
}

async function areBoardsDepartmentScoped(supabase, boardIds) {
  const { data, error } = await supabase
    .from('boards')
    .select('department_id')
    .in('id', boardIds);

  if (error) return false;
  return (data ?? []).length > 0 && (data ?? []).every((row) => row.department_id != null);
}

const CommunityModel = {
  findPostsByBoardIds: async ({
    boardId,
    boardIds,
    boardKind,
    boardKinds,
    departmentId,
  }) => {
    const ids = await BoardModel.resolveBoardIds({
      boardId,
      boardIds,
      boardKind,
      boardKinds,
      departmentId,
    });

    if (!ids) {
      const err = new Error('boardId, boardIds, 또는 boardKind 쿼리가 필요합니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const deptScopedBoards = await areBoardsDepartmentScoped(supabase, ids);

    if (deptScopedBoards && !departmentId) {
      const err = new Error('departmentId 쿼리가 필요합니다.');
      err.status = 400;
      throw err;
    }

    const departmentFilterIds =
      deptScopedBoards || !departmentId ? null : getDepartmentFilterIds(departmentId);

    let query = supabase
      .from('posts')
      .select(buildPostSelect(departmentFilterIds))
      .in('board_id', ids)
      .order('created_at', { ascending: false });

    if (departmentFilterIds) {
      query = query.in('users.department_id', departmentFilterIds);
    }

    const { data, error } = await query;

    if (error) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(mapPostRow);
  },

  findPostByIdAndIncrementView: async (id, accessContext = {}) => {
    const postId = Number(id);
    if (!Number.isInteger(postId) || postId < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    await assertReadablePostById(supabase, postId, accessContext);

    const { data: existing, error: fetchError } = await supabase
      .from('posts')
      .select('id, view_num')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!existing) {
      const err = new Error('게시글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    const nextViewNum = (existing.view_num ?? 0) + 1;

    const { data, error } = await supabase
      .from('posts')
      .update({ view_num: nextViewNum })
      .eq('id', postId)
      .select(buildPostSelect(null))
      .single();

    if (error) {
      const err = new Error('조회수 갱신에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapPostRow(data);
  },

  findCommentsByPostId: async (postId, accessContext = {}) => {
    const id = Number(postId);
    if (!Number.isInteger(id) || id < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    await assertReadablePostById(supabase, id, accessContext);

    const { data, error } = await supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      const err = new Error('댓글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(mapCommentRow);
  },

  createComment: async ({ postId, userId, content }) => {
    const resolvedPostId = Number(postId);
    const authorId = Number(userId);

    if (!Number.isInteger(resolvedPostId) || resolvedPostId < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    if (!Number.isInteger(authorId) || authorId < 1) {
      const err = new Error('유효하지 않은 사용자입니다.');
      err.status = 401;
      throw err;
    }

    const supabase = getServerClient();
    await assertReadablePostById(supabase, resolvedPostId, { userId: authorId });

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: resolvedPostId,
        user_id: authorId,
        content: String(content).trim(),
      })
      .select(COMMENT_SELECT)
      .single();

    if (error) {
      const err = new Error('댓글 작성에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapCommentRow(data);
  },

  deletePostByAuthor: async ({ postId, userId }) => {
    const resolvedPostId = Number(postId);
    const authorId = Number(userId);

    if (!Number.isInteger(resolvedPostId) || resolvedPostId < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', resolvedPostId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!post) {
      const err = new Error('게시글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    if (post.user_id !== authorId) {
      const err = new Error('본인이 작성한 게시글만 삭제할 수 있습니다.');
      err.status = 403;
      throw err;
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', resolvedPostId);

    if (deleteError) {
      const err = new Error('게시글 삭제에 실패했습니다.');
      err.status = 500;
      err.cause = deleteError;
      throw err;
    }

    return { id: resolvedPostId };
  },

  updatePostByAuthor: async ({ postId, userId, title, content, boardId }) => {
    const resolvedPostId = Number(postId);
    const authorId = Number(userId);
    const resolvedBoardId = Number(boardId);

    if (!Number.isInteger(resolvedPostId) || resolvedPostId < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    await assertWritableBoard(supabase, resolvedBoardId, authorId);

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', resolvedPostId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!post) {
      const err = new Error('게시글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    if (post.user_id !== authorId) {
      const err = new Error('본인이 작성한 게시글만 수정할 수 있습니다.');
      err.status = 403;
      throw err;
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        board_id: resolvedBoardId,
        title: String(title).trim(),
        content: String(content).trim(),
      })
      .eq('id', resolvedPostId)
      .select(buildPostSelect(null))
      .single();

    if (error) {
      const err = new Error('게시글 수정에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapPostRow(data);
  },

  updateCommentByAuthor: async ({ commentId, userId, content }) => {
    const resolvedCommentId = Number(commentId);
    const authorId = Number(userId);

    if (!Number.isInteger(resolvedCommentId) || resolvedCommentId < 1) {
      const err = new Error('유효하지 않은 댓글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', resolvedCommentId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('댓글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!comment) {
      const err = new Error('댓글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    if (comment.user_id !== authorId) {
      const err = new Error('본인이 작성한 댓글만 수정할 수 있습니다.');
      err.status = 403;
      throw err;
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ content: String(content).trim() })
      .eq('id', resolvedCommentId)
      .select(COMMENT_SELECT)
      .single();

    if (error) {
      const err = new Error('댓글 수정에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapCommentRow(data);
  },

  deleteCommentByAuthor: async ({ commentId, userId }) => {
    const resolvedCommentId = Number(commentId);
    const authorId = Number(userId);

    if (!Number.isInteger(resolvedCommentId) || resolvedCommentId < 1) {
      const err = new Error('유효하지 않은 댓글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', resolvedCommentId)
      .maybeSingle();

    if (fetchError) {
      const err = new Error('댓글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = fetchError;
      throw err;
    }

    if (!comment) {
      const err = new Error('댓글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

    if (comment.user_id !== authorId) {
      const err = new Error('본인이 작성한 댓글만 삭제할 수 있습니다.');
      err.status = 403;
      throw err;
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', resolvedCommentId);

    if (deleteError) {
      const err = new Error('댓글 삭제에 실패했습니다.');
      err.status = 500;
      err.cause = deleteError;
      throw err;
    }

    return { id: resolvedCommentId };
  },

  createPost: async ({ userId, boardId, title, content }) => {
    const authorId = Number(userId);
    const resolvedBoardId = Number(boardId);

    if (!Number.isInteger(authorId) || authorId < 1) {
      const err = new Error('유효하지 않은 사용자입니다.');
      err.status = 401;
      throw err;
    }

    const supabase = getServerClient();
    await assertWritableBoard(supabase, resolvedBoardId, authorId);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_id: resolvedBoardId,
        user_id: authorId,
        title: String(title).trim(),
        content: String(content).trim(),
      })
      .select(buildPostSelect(null))
      .single();

    if (error) {
      const err = new Error('게시글 작성에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapPostRow(data);
  },

  findAdminAuthorId: async () => {
    const adminStudentId = process.env.COMMUNITY_ADMIN_STUDENT_ID || 'admin';
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', adminStudentId)
      .maybeSingle();

    if (error) {
      const err = new Error('관리자 정보를 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return data?.id ?? null;
  },
};

module.exports = CommunityModel;
