import { plainTextExcerpt, formatPostTime } from '../community/communityData';
import { API_BASE_URL } from '../constants';

const RECRUIT_TAG = {
  tag: '같이밥',
  tagClass: 'bg-primary-container text-on-primary-container',
};

const REVIEW_TAG = {
  tag: '리뷰',
  tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
};

const HASHTAG_REGEX = /#([가-힣A-Za-z0-9_]+)/g;

export function extractHashtags(text) {
  if (!text) return [];
  const seen = new Set();
  const tags = [];
  for (const match of String(text).matchAll(HASHTAG_REGEX)) {
    const tag = match[1];
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

export function parseTourPostMeta(title = '', content = '') {
  const isRecruit = String(title).trim().startsWith('[같이밥]');
  const hashtags = extractHashtags(`${title} ${content}`);
  const typeMeta = isRecruit ? RECRUIT_TAG : REVIEW_TAG;

  return {
    postType: typeMeta.tag,
    tag: typeMeta.tag,
    tagClass: typeMeta.tagClass,
    hashtags,
    isRecruit,
  };
}

export function formatTourDisplayTitle(title = '') {
  return String(title).replace('[같이밥]', '').replace('[tour-seed]', '').trim();
}

const HASHTAG_LINE_REGEX = /^(#[가-힣A-Za-z0-9_]+\s*)+$/;

export function splitTourPostContent(content = '') {
  const bodyLines = [];
  const hashtags = extractHashtags(content);

  for (const line of String(content).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || HASHTAG_LINE_REGEX.test(trimmed)) continue;
    bodyLines.push(line);
  }

  return {
    body: bodyLines.join('\n').trim(),
    hashtags: hashtags.length ? hashtags : ['맛집'],
  };
}

export async function fetchTourPlaces() {
  const res = await fetch(`${API_BASE_URL}/api/tour/places`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '음식점 목록을 불러오지 못했습니다.');
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return { places: data, topTags: [] };
  }
  return {
    places: data.places ?? [],
    topTags: data.topTags ?? [],
  };
}

export async function fetchPlacePosts(boardId) {
  const res = await fetch(`${API_BASE_URL}/api/community/posts?boardId=${boardId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '게시글을 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.map(mapTourPost);
}

export async function fetchAllPlacePosts(boardIds) {
  const ids = boardIds.filter(Boolean);
  if (!ids.length) return [];

  const query =
    ids.length === 1 ? `boardId=${ids[0]}` : `boardIds=${ids.join(',')}`;
  const res = await fetch(`${API_BASE_URL}/api/community/posts?${query}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '게시글을 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.map(mapTourPost);
}

export function attachPlaceNames(posts, places) {
  const byBoardId = new Map(places.map((place) => [place.boardId, place]));
  return posts.map((post) => {
    const place = byBoardId.get(post.boardId);
    return {
      ...post,
      placeName: place?.name ?? '',
      placeId: place?.id ?? null,
    };
  });
}

export function filterRecruitPosts(posts) {
  return posts.filter((post) => post.postType === '같이밥');
}

export function sortPostsByNewest(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function mapTourPost(post) {
  const meta = parseTourPostMeta(post.title, post.content);
  const displayTitle = String(post.title)
    .replace('[같이밥]', '')
    .replace('[tour-seed]', '')
    .trim();

  return {
    id: post.id,
    boardId: post.boardId,
    tag: meta.tag,
    tagClass: meta.tagClass,
    postType: meta.postType,
    hashtags: meta.hashtags,
    time: formatPostTime(post.createdAt),
    title: displayTitle,
    excerpt: plainTextExcerpt(post.content),
    authorName: post.authorName,
    createdAt: post.createdAt,
    viewCount: post.viewCount ?? 0,
    comments: post.commentCount ?? 0,
  };
}

export function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return '';
  const value = Number(meters);
  if (value < 1000) return `${value}m`;
  return `${(value / 1000).toFixed(1)}km`;
}

export function filterPlacesByTag(places, activeTag) {
  if (!activeTag || activeTag === '전체') return places;
  return places.filter((place) => (place.tagCounts?.[activeTag] ?? 0) > 0);
}

export function sortPlacesByPopularity(places, activeTag) {
  return [...places].sort((a, b) => {
    const scoreA =
      activeTag && activeTag !== '전체'
        ? (a.tagCounts?.[activeTag] ?? 0)
        : (a.reviewCount ?? 0);
    const scoreB =
      activeTag && activeTag !== '전체'
        ? (b.tagCounts?.[activeTag] ?? 0)
        : (b.reviewCount ?? 0);
    return scoreB - scoreA || (a.distanceM ?? 0) - (b.distanceM ?? 0);
  });
}

export function filterPostsByTag(posts, activeTag) {
  if (!activeTag || activeTag === '전체') return posts;
  return posts.filter((post) => post.hashtags?.includes(activeTag));
}

export function filterPostsBySearch(posts, query) {
  const term = query.trim().toLowerCase();
  if (!term) return posts;
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(term) ||
      post.excerpt.toLowerCase().includes(term) ||
      post.placeName?.toLowerCase().includes(term) ||
      post.hashtags?.some((tag) => tag.toLowerCase().includes(term)) ||
      (post.authorName && post.authorName.toLowerCase().includes(term)),
  );
}
