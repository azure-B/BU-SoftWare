import { API_BASE_URL } from '../constants';
import { fetchDepartmentBoardMap, formatPostTime } from './communityData';
import { formatPostDate } from './postData';

export const QNA_ANSWER_DELIMITER = '---QNA_ANSWER---';
export const QNA_PAGE_SIZE = 3;

export const QNA_CATEGORIES = ['학사/수강', '장학/등록', '시설/이용', '기타'];

export function parseQnaTitle(title) {
  const raw = String(title ?? '').trim();
  const match = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
  return {
    category: match?.[1] ?? '기타',
    questionTitle: match?.[2]?.trim() || raw,
  };
}

export function parseQnaContent(content) {
  const raw = String(content ?? '');
  const [questionPart, answerPart] = raw.split(QNA_ANSWER_DELIMITER);
  const questionBody = questionPart.trim();

  if (!answerPart?.trim()) {
    return { questionBody, answerMeta: null, answerBody: null };
  }

  const lines = answerPart.trim().split(/\n+/);
  let answerMeta = { responder: '학사지원팀', answeredAt: null };
  const bodyLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('답변:')) {
      answerMeta.responder = trimmed.replace(/^답변:\s*/, '');
      continue;
    }
    if (trimmed.startsWith('답변일:')) {
      answerMeta.answeredAt = trimmed.replace(/^답변일:\s*/, '');
      continue;
    }
    bodyLines.push(trimmed);
  }

  return {
    questionBody,
    answerMeta,
    answerBody: bodyLines.join('\n').trim() || null,
  };
}

export function mapApiQnaPost(post) {
  const { category, questionTitle } = parseQnaTitle(post.title);
  const parsed = parseQnaContent(post.content);

  return {
    id: post.id,
    boardId: post.boardId,
    boardKind: post.boardKind ?? 'qna',
    category,
    questionTitle,
    title: questionTitle,
    questionBody: parsed.questionBody,
    answerMeta: parsed.answerMeta,
    answerBody: parsed.answerBody,
    hasAnswer: Boolean(parsed.answerBody),
    authorName: post.authorName ?? '익명',
    authorDepartmentName: post.authorDepartmentName ?? null,
    createdAt: post.createdAt,
    time: formatPostTime(post.createdAt),
    viewCount: post.viewCount ?? 0,
  };
}

export function mapApiQnaDetail(post) {
  const mapped = mapApiQnaPost(post);
  return {
    ...mapped,
    authorId: post.authorId,
    formattedDate: formatPostDate(post.createdAt),
    formattedAnswerDate: mapped.answerMeta?.answeredAt
      ? formatPostDate(mapped.answerMeta.answeredAt)
      : null,
    contentHtml: post.content,
  };
}

export function filterQnaPosts(posts, query) {
  const term = query.trim().toLowerCase();
  if (!term) return posts;

  return posts.filter(
    (item) =>
      item.questionTitle.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.questionBody.toLowerCase().includes(term) ||
      (item.answerBody && item.answerBody.toLowerCase().includes(term)) ||
      (item.authorName && item.authorName.toLowerCase().includes(term)),
  );
}

export async function fetchQnaPosts() {
  const res = await fetch(`${API_BASE_URL}/api/community/posts?boardKind=qna`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Q&A 목록을 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.map(mapApiQnaPost);
}

export const QNA_WRITE_GUIDELINES = [
  '학사·장학 등 카테고리를 정확히 선택해 주세요.',
  '질문은 한눈에 이해되도록 간결하게 작성해 주세요.',
  '개인정보(연락처, 학번 전체)는 질문에 포함하지 마세요.',
  '답변은 담당 부서 확인 후 등록됩니다.',
];

export function buildQnaPostPayload({ category, questionTitle }) {
  const cat = String(category ?? '').trim() || '기타';
  const question = String(questionTitle ?? '').trim();
  return {
    title: `[${cat}] ${question}`,
    content: question,
  };
}

export function parseQnaPostForEdit(post) {
  const { category, questionTitle } = parseQnaTitle(post?.title);
  return { category, questionTitle };
}

export async function resolveQnaBoardId(departmentId) {
  if (!departmentId) return null;
  const map = await fetchDepartmentBoardMap(departmentId);
  return map.qna ?? null;
}

export function paginateItems(items, page, pageSize = QNA_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}
