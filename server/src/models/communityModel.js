const { getServerClient } = require('../config/supabase');

const COMMUNITY_WRITABLE_BOARD_IDS = new Set([3, 4]);
const CAMPUS_TOUR_BOARD_CATEGORY = 'campus_tour';

async function assertWritableBoard(supabase, boardId) {
  if (!Number.isInteger(boardId) || boardId < 1) {
    const err = new Error('유효하지 않은 게시판입니다.');
    err.status = 400;
    throw err;
  }

  if (COMMUNITY_WRITABLE_BOARD_IDS.has(boardId)) return;

  const { data, error } = await supabase
    .from('boards')
    .select('category')
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

  const err = new Error('글을 작성할 수 없는 게시판입니다.');
  err.status = 400;
  throw err;
}

const POST_SELECT = `
  id,
  board_id,
  user_id,
  title,
  content,
  created_at,
  view_num,
  users ( name ),
  comments ( count )
`;

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
    authorId: row.user_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    viewCount: row.view_num ?? 0,
    authorName: row.users?.name ?? '익명',
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

function parseBoardIds(boardId, boardIds) {
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

const CommunityModel = {
  findPostsByBoardIds: async (boardId, boardIds) => {
    const ids = parseBoardIds(boardId, boardIds);
    if (!ids) {
      const err = new Error('boardId 또는 boardIds 쿼리가 필요합니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    let query = supabase
      .from('posts')
      .select(POST_SELECT)
      .in('board_id', ids)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(mapPostRow);
  },

  findPostByIdAndIncrementView: async (id) => {
    const postId = Number(id);
    if (!Number.isInteger(postId) || postId < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();

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
      .select(POST_SELECT)
      .single();

    if (error) {
      const err = new Error('조회수 갱신에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapPostRow(data);
  },

  findCommentsByPostId: async (postId) => {
    const id = Number(postId);
    if (!Number.isInteger(id) || id < 1) {
      const err = new Error('유효하지 않은 게시글 ID입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
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

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', resolvedPostId)
      .maybeSingle();

    if (postError) {
      const err = new Error('게시글 조회에 실패했습니다.');
      err.status = 500;
      err.cause = postError;
      throw err;
    }

    if (!post) {
      const err = new Error('게시글을 찾을 수 없습니다.');
      err.status = 404;
      throw err;
    }

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
    await assertWritableBoard(supabase, resolvedBoardId);

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
      .select(POST_SELECT)
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
    await assertWritableBoard(supabase, resolvedBoardId);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_id: resolvedBoardId,
        user_id: authorId,
        title: String(title).trim(),
        content: String(content).trim(),
      })
      .select(POST_SELECT)
      .single();

    if (error) {
      const err = new Error('게시글 작성에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapPostRow(data);
  },
};

module.exports = CommunityModel;
