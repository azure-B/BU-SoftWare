/** board_id ↔ 사이드바 slug (DB 시드 기준) */
export const BOARD_IDS = {
  scholarship: 1,
  contest: 2,
  mentoring: 3,
  team: 4,
  'dept-board': 5,
};

/** 대시보드 Campus Digest 중요 공지 전용 (학생광장·Post 상세와 분리) */
export const DASHBOARD_NOTICE_BOARD_ID = 100;

export const COMMUNITY_SIDEBAR = [
  { id: 'scholarship', label: '장학 공고', icon: 'payments' },
  { id: 'contest', label: '대회 공고', icon: 'emoji_events' },
  {
    id: 'community',
    label: '커뮤니티',
    icon: 'groups',
    children: [
      { id: 'mentoring', label: '멘토링' },
      { id: 'team', label: '팀프로젝트' },
    ],
  },
  { id: 'dept-board', label: '학과 게시판', icon: 'school' },
];

export const COMMUNITY_FILTERS = ['전체', '멘토링', '팀프로젝트'];

export const COMMUNITY_PAGE_META = {
  scholarship: {
    title: '장학 공고',
    description: '교내·국가 장학금 및 근로 장학 관련 공지를 확인하세요.',
  },
  contest: {
    title: '대회 공고',
    description: '교내·대외 경진대회 및 해커톤 참가 안내를 모았습니다.',
  },
  community: {
    title: '커뮤니티',
    description: '멘토링과 팀 프로젝트 모집, 학생 간 협업과 소통을 위한 공간입니다.',
  },
  mentoring: {
    title: '멘토링',
    description: '전공·취업 멘토링과 스터디 모집 글을 확인하세요.',
  },
  team: {
    title: '팀프로젝트',
    description: '조별 과제·졸업작품·팀플 팀원 모집 글을 확인하세요.',
  },
  'dept-board': {
    title: '학과 게시판',
    description: '학과 생활, 수강, 진로 관련 자유 토론 공간입니다.',
  },
};

export const BOARD_TAG_BY_ID = {
  1: { tag: '장학', tagClass: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  2: { tag: '대회', tagClass: 'bg-secondary-fixed text-on-secondary-fixed' },
  3: { tag: '멘토링', tagClass: 'bg-primary-container text-on-primary-container' },
  4: { tag: '팀프로젝트', tagClass: 'bg-surface-container-high text-on-surface' },
  5: { tag: '학과', tagClass: 'bg-surface-container-high text-on-surface' },
};

export const COMMUNITY_FAQ = [
  '수강신청 변경 기간은 언제간가요?',
  '상장금 지급일은 언제인가요?',
  '장학금 신청 서류 제출 방법 안내',
];

export const COMMUNITY_QUICK_LINKS = [
  { label: '중앙도서관', href: '#library' },
  { label: '종합정보시스템', href: '#portal' },
];

const COMMUNITY_BOARD_SET = new Set(['community', 'mentoring', 'team']);

export function boardIdToSlug(id) {
  if (id === 3) return 'mentoring';
  if (id === 4) return 'team';
  if (id === 1) return 'scholarship';
  if (id === 2) return 'contest';
  if (id === 5) return 'dept-board';
  return 'community';
}

export function slugToBoardId(slug) {
  return BOARD_IDS[slug] ?? null;
}

export function isCommunitySection(boardSlug) {
  return COMMUNITY_BOARD_SET.has(boardSlug);
}

export function getBoardIdsForFetch(boardSlug, filter) {
  if (boardSlug === 'scholarship') return [BOARD_IDS.scholarship];
  if (boardSlug === 'contest') return [BOARD_IDS.contest];
  if (boardSlug === 'dept-board') return [BOARD_IDS['dept-board']];
  if (boardSlug === 'mentoring') return [BOARD_IDS.mentoring];
  if (boardSlug === 'team') return [BOARD_IDS.team];

  if (filter === '멘토링') return [BOARD_IDS.mentoring];
  if (filter === '팀프로젝트') return [BOARD_IDS.team];
  return [BOARD_IDS.mentoring, BOARD_IDS.team];
}

export function formatPostTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function filterPostsBySearch(posts, query) {
  const term = query.trim().toLowerCase();
  if (!term) return posts;

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(term) ||
      post.excerpt.toLowerCase().includes(term) ||
      (post.authorName && post.authorName.toLowerCase().includes(term)),
  );
}

export const DASHBOARD_SQUARE_TABS = [
  { id: 'scholarship', label: '장학 공고', boardId: BOARD_IDS.scholarship },
  { id: 'dept-board', label: '학과 게시판', boardId: BOARD_IDS['dept-board'] },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTopViewedPostsInDays(
  posts,
  { days = 7, limit = 3, fallbackToAll = true } = {},
) {
  const cutoff = Date.now() - days * MS_PER_DAY;

  const sortByViews = (list) =>
    [...list].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, limit);

  const recent = sortByViews(
    posts.filter((post) => {
      const created = new Date(post.createdAt).getTime();
      return !Number.isNaN(created) && created >= cutoff;
    }),
  );

  if (recent.length > 0 || !fallbackToAll) return recent;

  return sortByViews(posts);
}

export function plainTextExcerpt(content, maxLen = 120) {
  const text = String(content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function mapApiPost(post) {
  const tagMeta = BOARD_TAG_BY_ID[post.boardId] ?? {
    tag: '일반',
    tagClass: 'bg-surface-container-high text-on-surface',
  };

  return {
    id: post.id,
    boardId: post.boardId,
    tag: tagMeta.tag,
    tagClass: tagMeta.tagClass,
    time: formatPostTime(post.createdAt),
    title: post.title,
    excerpt: post.content,
    authorName: post.authorName,
    createdAt: post.createdAt,
    viewCount: post.viewCount ?? 0,
    comments: post.commentCount ?? 0,
  };
}
