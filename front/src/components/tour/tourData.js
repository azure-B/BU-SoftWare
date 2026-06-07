/** 백석대학교 학생복지동 (카카오 장소 검색 좌표) */
export const TOUR_MAP_CENTER = { lat: 36.8406135, lng: 127.1824946 };
export const TOUR_MAP_KEYWORD = '백석대학교 학생복지동';
export const TOUR_MAP_LEVEL = 3;
export const TOUR_SELECTED_PLACE_LEVEL = 4;

export const TOUR_POST_TAGS = ['맛집', '혼밥', '같이밥', '점심', '저녁', '카페', '추천', '학식'];

/** 글 작성 인기 태그 — 모바일 1줄 · PC 2줄 이내 노출 */
export const POPULAR_TAG_MOBILE_MAX = 5;
export const POPULAR_TAG_DESKTOP_MAX = 10;

/** 사이드바 인기 태그 필터 — '전체' 포함 노출 개수 */
export const SIDEBAR_TAG_MOBILE_VISIBLE = 5;
export const SIDEBAR_TAG_DESKTOP_VISIBLE = 7;

export function resolveTourPopularTags(topTags = []) {
  const merged = [];
  const seen = new Set();
  for (const tag of [...topTags, ...TOUR_POST_TAGS]) {
    const normalized = String(tag ?? '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    merged.push(normalized);
  }
  return merged;
}

export const TOUR_SECTION_TABS = [
  { id: 'places', label: '음식점' },
  { id: 'recruit', label: '같이밥 모집' },
];

export const TOUR_RECOMMENDED = [
  {
    id: 'ttukbaegi',
    category: '한식',
    title: '안서동 뚝배기',
    description: '든든한 한 끼가 필요할 때 가장 먼저 생각나는 곳. 제육볶음이 특히 인기 있습니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD57vhM_KZbpohe66abNe-T5kmzzyDRqIbG0VX3ki3ha9zqV7WYoX-YkAmIUtToMs51Jsgq2VYauDut5SSqzMJdLT8NKKdwU7WvVmLF8R8tCPOkMTmLoNJiGlOom_6CCtlpqG0pFb0e5d7x4JPvAilMrGKuqLv2b07nV7TFdZGcArrTy0vplCZmVMJ22SGvc6Caz2jF2sqFz5HHXxdMN7rawMIKDWAZARhlscuKhFc6wXLpPvIGiLdG0HSzv0J5WjyDtOuYqYIxpg',
    alt: 'Korean Food Bowl',
  },
  {
    id: 'libre',
    category: '디저트',
    title: '카페 리브르',
    description:
      '과제하기 좋은 조용한 분위기와 직접 구운 휘낭시에가 매력적인 공간입니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA93iLiXqSs48pWSmoHKt_JXIayta6IPt91bL-HnXW_jKCXfvQTYvQUFyYTNCwp-IthF8esgRJ0PeXMKyuwGH906LgQc80rUBYFl48UCF4KPTliZKst5hPH0FERFFgy9RyOpqEN8AODT716f8IO3wl9036rVGi81HLTu212fgFpj03g1OhGEKOklJ63XSil-vSqEQE7tNFnFKkGfR_pzo8EsLCMNiLp7tvLPYiulwD_1Zw8_OjJCzg09vgG1ZR5pJG9D7kzRASYSA',
    alt: 'Cafe Desserts',
  },
  {
    id: 'study-room',
    category: '모임',
    title: '정문 스터디룸',
    description: '팀 프로젝트 모임에 최적화된 공간. 대형 모니터와 화이트보드가 완비되어 있습니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAm1HHvM1Vy8E45BIVpQ1GjZsKGiKvqkwiCY1PCbRLkKVfkYEAOGQ2aR6uky1vejb33-bEgFhHeqhdrnF8Omex65flc7gCG8OpNFhFC5Thbk4tY_-OrGpjnidivwj1VT-TBOfQc3bCJIn9YiHAy2kXSd85oLmW_dh9Al4MSoOQxifl0LtXoQ-EaV9Ou4fXV3Ie7B-lmtJgZiVp39-f_9vmM2j8lBNzFTDPUApwLeNb85gVnxYV83uphGWe4MbY3N8izansbAMrVTw',
    alt: 'Study Room',
  },
];

export const TOUR_POPULAR = ['할머니 손칼국수', '블루포트', '안서동 치킨'];
