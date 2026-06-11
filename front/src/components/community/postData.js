import { BOARD_TAG_BY_ID } from './communityData';
import { API_BASE_URL } from '../constants';
import { loadStoredAuth } from '../../utils/authSession';

const postDetailInflight = new Map();

export function formatPostDate(isoOrDate) {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function contentToParagraphs(content) {
  if (!content) return [];
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function isHtmlContent(content) {
  return /<[a-z][\s\S]*>/i.test(content ?? '');
}

export function isEmptyEditorContent(html) {
  const text = String(html ?? '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return text.length === 0;
}

export function mapApiPostDetail(post) {
  const tagMeta = BOARD_TAG_BY_ID[post.boardId] ?? {
    tag: '일반',
    tagClass: 'bg-surface-container-high text-on-surface',
  };

  const html = isHtmlContent(post.content);

  return {
    id: post.id,
    boardId: post.boardId,
    boardKind: post.boardKind ?? null,
    authorId: post.authorId,
    categoryLabel: tagMeta.tag,
    title: post.title,
    authorName: post.authorName ?? '익명',
    createdAt: post.createdAt,
    viewCount: post.viewCount ?? 0,
    commentCount: post.commentCount ?? 0,
    contentHtml: post.content,
    isHtml: html,
    paragraphs: html ? [] : contentToParagraphs(post.content),
  };
}

export async function createCommunityPost({ token, boardId, title, content }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ boardId, title, content }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '게시글 작성에 실패했습니다.');
  }

  return body;
}

export async function updateCommunityPost({ token, postId, boardId, title, content }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ boardId, title, content }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '게시글 수정에 실패했습니다.');
  }

  return mapApiPostDetail(body);
}

function mapApiComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    authorName: comment.authorName ?? '익명',
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function buildCommunityPostUrl(postId, suffix = '') {
  const id = Number(postId);
  return `${API_BASE_URL}/api/community/posts/${id}${suffix}`;
}

function buildPostAccessHeaders() {
  const token = loadStoredAuth()?.session?.token;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchPostComments(postId) {
  const id = Number(postId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('게시글 정보가 없습니다.');
  }

  const res = await fetch(buildCommunityPostUrl(id, '/comments'), {
    headers: buildPostAccessHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '댓글을 불러오지 못했습니다.');
  }

  return (body ?? []).map(mapApiComment);
}

export async function createPostComment({ token, postId, content }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '댓글 작성에 실패했습니다.');
  }

  return mapApiComment(body);
}

export async function updatePostComment({ token, commentId, content }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '댓글 수정에 실패했습니다.');
  }

  return mapApiComment(body);
}

export async function deletePostComment({ token, commentId }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '댓글 삭제에 실패했습니다.');
  }

  return body;
}

export async function deleteCommunityPost({ token, postId }) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '게시글 삭제에 실패했습니다.');
  }

  return body;
}

export async function fetchPostDetail(postId) {
  const id = Number(postId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('게시글 정보가 없습니다.');
  }

  if (postDetailInflight.has(id)) {
    return postDetailInflight.get(id);
  }

  const request = (async () => {
    const res = await fetch(buildCommunityPostUrl(id), {
      headers: buildPostAccessHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.error || '게시글을 불러오지 못했습니다.');
    }
    const data = await res.json();
    return mapApiPostDetail(data);
  })();

  postDetailInflight.set(id, request);

  try {
    return await request;
  } finally {
    postDetailInflight.delete(id);
  }
}
