require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');
const TourModel = require('../src/models/tourModel');
const { TOUR_SEARCH_CENTER } = require('../src/utils/tourConstants');

const SEED_MARKER = '[tour-seed]';
const TARGET_COUNT = 40;
/** 학생복지동 기준 핀과 동일 — Kakao category 검색 반경(m) */
const SEED_RADIUS_M = 150;

const TAG_POOL = ['맛집', '혼밥', '같이밥', '점심', '저녁', '카페', '추천', '학식'];

const REVIEW_TITLES = [
  '여기 진짜 맛있어요',
  '가성비 최고입니다',
  '학생 할인 있어요',
  '분위기가 편해요',
  '과제 끝나고 자주 가요',
  '메뉴 구성이 좋아요',
  '사장님이 친절해요',
  '양이 넉넉해요',
];

const RECRUIT_TITLES = [
  '점심 같이 드실 분 구해요',
  '오늘 저녁 같이밥 하실 분',
  '혼밥하기 싫어서 모집합니다',
  '수업 끝나고 밥 먹을 사람',
  '같이 가서 메뉴 나눠 먹어요',
];

const REVIEW_BODIES = [
  '학생복지동 기준 150m 안이라 수업 전후로 들르기 좋아요.',
  '복지동 핀 근처 맛집이라 자주 가요.',
  '웨이팅이 조금 있지만 기다릴 만한 맛입니다.',
  '1인 메뉴도 있어서 혼밥하기 편했어요.',
  '친구들이랑 가기 좋고 테이블 간격도 괜찮아요.',
];

const RECRUIT_BODIES = [
  '오늘 12시 30분쯤 방문 예정입니다. 편하게 댓글 남겨 주세요.',
  '처음 가보는 곳이라 같이 가실 분 있으면 좋겠어요.',
  '혼밥 부담 없이 같이 드실 분 찾습니다.',
  '수업 끝나고 바로 갈 예정이에요. 연락 주세요.',
];

function pick(items, index) {
  return items[index % items.length];
}

function buildTags(index, placeIndex) {
  const primary = TAG_POOL[(index + placeIndex) % TAG_POOL.length];
  const secondary = TAG_POOL[(index * 2 + 3) % TAG_POOL.length];
  return primary === secondary ? [primary, '맛집'] : [primary, secondary];
}

function buildPost(place, index, placeIndex) {
  const isRecruit = index % 4 === 0;
  const tags = buildTags(index, placeIndex);

  const title = isRecruit
    ? `[같이밥] ${pick(RECRUIT_TITLES, index)}`
    : pick(REVIEW_TITLES, index);

  const body = isRecruit ? pick(RECRUIT_BODIES, index) : pick(REVIEW_BODIES, index);
  const hashtagLine = tags.map((tag) => `#${tag}`).join(' ');

  return {
    board_id: place.boardId,
    title: `${title} ${SEED_MARKER}`,
    content: `${body}\n\n${hashtagLine}`,
    created_at: new Date(Date.now() - index * 3600 * 1000).toISOString(),
  };
}

async function resolveAuthorId(supabase) {
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .order('id', { ascending: true })
    .limit(1);

  if (error || !users?.length) {
    throw new Error('시드 작성자(users)를 찾을 수 없습니다.');
  }

  return users[0].id;
}

function filterPlacesWithinRadius(places, radiusM) {
  return places
    .filter((place) => place.distanceM != null && place.distanceM <= radiusM)
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
}

async function run() {
  const supabase = getServerClient();
  const { places } = await TourModel.findPlaces();
  const targetPlaces = filterPlacesWithinRadius(places, SEED_RADIUS_M);

  if (!targetPlaces.length) {
    throw new Error(
      `학생복지동 기준 ${SEED_RADIUS_M}m 이내 음식점이 없습니다. npm run tour:sync 실행 후 재시도하세요.`,
    );
  }

  const authorId = await resolveAuthorId(supabase);
  const boardIds = places.map((place) => place.boardId);

  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .in('board_id', boardIds)
    .like('title', `%${SEED_MARKER}%`);

  if (existing?.length) {
    await supabase
      .from('posts')
      .delete()
      .in(
        'id',
        existing.map((row) => row.id),
      );
    console.log(`기존 tour 더미 ${existing.length}건 삭제 후 재시드합니다.`);
  }

  const payload = Array.from({ length: TARGET_COUNT }, (_, index) => {
    const placeIndex = index % targetPlaces.length;
    const place = targetPlaces[placeIndex];
    return {
      ...buildPost(place, index, placeIndex),
      user_id: authorId,
    };
  });

  const { data, error } = await supabase.from('posts').insert(payload).select('id, board_id, title');

  if (error) {
    throw new Error(`게시글 시드 실패: ${error.message}`);
  }

  const countsByBoard = {};
  for (const row of data) {
    countsByBoard[row.board_id] = (countsByBoard[row.board_id] ?? 0) + 1;
  }

  const usedNames = targetPlaces
    .filter((place) => countsByBoard[place.boardId])
    .map((place) => `${place.name}(${countsByBoard[place.boardId]})`);

  console.log(
    `Inserted ${data.length} tour posts · ${TOUR_SEARCH_CENTER.lat},${TOUR_SEARCH_CENTER.lng} 기준 ${SEED_RADIUS_M}m 이내 ${targetPlaces.length}곳`,
  );
  console.log(usedNames.join(', '));
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
