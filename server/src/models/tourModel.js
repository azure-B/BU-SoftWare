const { getServerClient } = require('../config/supabase');
const { distanceMeters } = require('../utils/geo');
const {
  searchRestaurantsNearCenter,
  verifyKakaoPlaceExists,
} = require('../utils/kakaoLocalApi');
const {
  CAMPUS_TOUR_BOARD_CATEGORY,
  TOUR_SEARCH_CENTER,
  TOUR_SEARCH_RADIUS_M,
  TOUR_VERIFY_INTERVAL_DAYS,
  TOUR_TOP_TAG_COUNT,
} = require('../utils/tourConstants');
const { aggregateTagCounts, pickTopTags } = require('../utils/tourHashtags');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function isMissingColumnError(error, column) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  const columnName = String(column).toLowerCase();
  return (
    message.includes(columnName) &&
    (message.includes('does not exist') || message.includes('schema cache'))
  );
}

function stripVerificationTimestamps(payload) {
  const { synced_at: _syncedAt, last_verified_at: _verifiedAt, created_at: _createdAt, ...rest } =
    payload;
  return rest;
}

async function updateCampusPlace(supabase, id, payload) {
  let { error } = await supabase.from('campus_places').update(payload).eq('id', id);
  if (
    error &&
    (payload.synced_at != null ||
      payload.last_verified_at != null ||
      payload.created_at != null)
  ) {
    ({ error } = await supabase
      .from('campus_places')
      .update(stripVerificationTimestamps(payload))
      .eq('id', id));
  }
  return error;
}

async function insertCampusPlace(supabase, payload) {
  let { error } = await supabase.from('campus_places').insert(payload);
  if (
    error &&
    (payload.synced_at != null ||
      payload.last_verified_at != null ||
      payload.created_at != null)
  ) {
    ({ error } = await supabase.from('campus_places').insert(stripVerificationTimestamps(payload)));
  }
  return error;
}

function isVerificationDue(lastVerifiedAt) {
  if (!lastVerifiedAt) return true;
  const elapsedMs = Date.now() - new Date(lastVerifiedAt).getTime();
  return elapsedMs >= TOUR_VERIFY_INTERVAL_DAYS * MS_PER_DAY;
}

async function removeStaleRestaurant(supabase, place) {
  const boardId = place.board_id;

  const { error: placeError } = await supabase.from('campus_places').delete().eq('id', place.id);
  if (placeError) {
    const err = new Error(`폐업 음식점 삭제 실패 (${place.name})`);
    err.status = 500;
    err.cause = placeError;
    throw err;
  }

  if (!boardId) return;

  const { error: boardError } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('category', CAMPUS_TOUR_BOARD_CATEGORY);

  if (boardError) {
    const err = new Error(`음식점 게시판 삭제 실패 (${place.name})`);
    err.status = 500;
    err.cause = boardError;
    throw err;
  }
}

function mapPlaceRow(row, reviewCount = 0, tagCounts = {}) {
  return {
    id: row.id,
    boardId: row.board_id,
    kakaoPlaceId: row.kakao_place_id,
    name: row.name,
    category: row.category ?? '음식점',
    address: row.address ?? '',
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    distanceM: row.distance_m ?? 0,
    reviewCount,
    tagCounts,
  };
}

async function loadCampusTourPosts(supabase, boardIds) {
  if (!boardIds.length) {
    return { posts: [], reviewCounts: {}, tagCountsByBoard: {}, topTags: [] };
  }

  const { data, error } = await supabase
    .from('posts')
    .select('board_id, title, content')
    .in('board_id', boardIds);

  if (error) {
    const err = new Error('게시글 집계에 실패했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  const posts = data ?? [];
  const reviewCounts = {};
  for (const row of posts) {
    reviewCounts[row.board_id] = (reviewCounts[row.board_id] ?? 0) + 1;
  }

  const { global, byBoard } = aggregateTagCounts(posts);

  return {
    posts,
    reviewCounts,
    tagCountsByBoard: byBoard,
    topTags: pickTopTags(global, TOUR_TOP_TAG_COUNT),
  };
}

const TourModel = {
  findPlaces: async () => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('campus_places')
      .select(
        'id, kakao_place_id, name, category, address, lat, lng, distance_m, board_id',
      )
      .not('board_id', 'is', null)
      .lte('distance_m', TOUR_SEARCH_RADIUS_M)
      .order('distance_m', { ascending: true });

    if (error) {
      const err = new Error('음식점 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    const rows = data ?? [];
    const boardIds = rows.map((row) => row.board_id).filter(Boolean);
    const { reviewCounts, tagCountsByBoard, topTags } = await loadCampusTourPosts(
      supabase,
      boardIds,
    );

    const places = rows.map((row) =>
      mapPlaceRow(
        row,
        reviewCounts[row.board_id] ?? 0,
        tagCountsByBoard[row.board_id] ?? {},
      ),
    );

    return { places, topTags };
  },

  syncRestaurantsFromKakao: async () => {
    const supabase = getServerClient();
    const restaurants = await searchRestaurantsNearCenter();
    let createdBoards = 0;
    let createdPlaces = 0;
    let updatedPlaces = 0;

    for (const restaurant of restaurants) {
      const { data: existingPlace } = await supabase
        .from('campus_places')
        .select('id, board_id')
        .eq('kakao_place_id', restaurant.kakaoPlaceId)
        .maybeSingle();

      let boardId = existingPlace?.board_id ?? null;

      if (!boardId) {
        const { data: board, error: boardError } = await supabase
          .from('boards')
          .insert({
            name: restaurant.name,
            category: CAMPUS_TOUR_BOARD_CATEGORY,
          })
          .select('id')
          .single();

        if (boardError) {
          const err = new Error(
            `게시판 생성 실패 (${restaurant.name}): ${boardError.message}`,
          );
          err.status = 500;
          err.cause = boardError;
          throw err;
        }

        boardId = board.id;
        createdBoards += 1;
      }

      const syncedAt = nowIso();

      if (existingPlace) {
        const updateError = await updateCampusPlace(supabase, existingPlace.id, {
          board_id: boardId,
          name: restaurant.name,
          category: restaurant.category,
          address: restaurant.address,
          lat: restaurant.lat,
          lng: restaurant.lng,
          distance_m: restaurant.distanceM,
          synced_at: syncedAt,
          last_verified_at: syncedAt,
        });

        if (updateError) {
          const err = new Error(`장소 갱신 실패 (${restaurant.name})`);
          err.status = 500;
          err.cause = updateError;
          throw err;
        }
        updatedPlaces += 1;
        continue;
      }

      const placeError = await insertCampusPlace(supabase, {
        kakao_place_id: restaurant.kakaoPlaceId,
        name: restaurant.name,
        category: restaurant.category,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        distance_m: restaurant.distanceM,
        board_id: boardId,
        synced_at: syncedAt,
        last_verified_at: syncedAt,
      });

      if (placeError) {
        const err = new Error(`장소 생성 실패 (${restaurant.name})`);
        err.status = 500;
        err.cause = placeError;
        throw err;
      }

      createdPlaces += 1;
    }

    const syncedIds = new Set(restaurants.map((restaurant) => restaurant.kakaoPlaceId));
    const { data: linkedPlaces, error: linkedError } = await supabase
      .from('campus_places')
      .select('id, lat, lng, kakao_place_id')
      .not('board_id', 'is', null);

    if (linkedError) {
      const err = new Error('기존 음식점 거리 갱신에 실패했습니다.');
      err.status = 500;
      err.cause = linkedError;
      throw err;
    }

    for (const row of linkedPlaces ?? []) {
      if (syncedIds.has(row.kakao_place_id)) continue;
      if (row.lat == null || row.lng == null) continue;

      const distanceM = Math.round(
        distanceMeters(
          TOUR_SEARCH_CENTER.lat,
          TOUR_SEARCH_CENTER.lng,
          Number(row.lat),
          Number(row.lng),
        ),
      );

      const { error: distanceError } = await supabase
        .from('campus_places')
        .update({ distance_m: distanceM })
        .eq('id', row.id);

      if (distanceError) {
        const err = new Error('음식점 거리 재계산에 실패했습니다.');
        err.status = 500;
        err.cause = distanceError;
        throw err;
      }

      updatedPlaces += 1;
    }

    return {
      searched: restaurants.length,
      createdBoards,
      createdPlaces,
      updatedPlaces,
    };
  },

  shouldRunMonthlyVerification: async () => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('campus_places')
      .select('last_verified_at')
      .not('board_id', 'is', null)
      .order('last_verified_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (error) {
      if (isMissingColumnError(error, 'last_verified_at')) {
        console.warn(
          '[tour-maintenance] last_verified_at 컬럼 없음 — server/scripts/migrate-campus-tour-verify.sql 실행 후 월간 검증이 활성화됩니다.',
        );
        return false;
      }
      const err = new Error('음식점 검증 일정을 확인하지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    if (!data?.length) return false;
    return isVerificationDue(data[0].last_verified_at);
  },

  verifyAndPruneRestaurants: async ({ force = false } = {}) => {
    const supabase = getServerClient();
    const syncResult = await TourModel.syncRestaurantsFromKakao();
    const restaurants = await searchRestaurantsNearCenter();
    const restaurantById = new Map(restaurants.map((item) => [item.kakaoPlaceId, item]));

    const placeSelectWithVerified =
      'id, kakao_place_id, name, category, address, lat, lng, distance_m, board_id, last_verified_at';
    const placeSelectBase =
      'id, kakao_place_id, name, category, address, lat, lng, distance_m, board_id';

    let linkedPlaces;
    let hasVerificationTimestamps = true;
    const { data: placesWithVerified, error: linkedError } = await supabase
      .from('campus_places')
      .select(placeSelectWithVerified)
      .not('board_id', 'is', null);

    if (linkedError && isMissingColumnError(linkedError, 'last_verified_at')) {
      hasVerificationTimestamps = false;
      const { data: placesBase, error: baseError } = await supabase
        .from('campus_places')
        .select(placeSelectBase)
        .not('board_id', 'is', null);

      if (baseError) {
        const err = new Error('음식점 검증 대상을 불러오지 못했습니다.');
        err.status = 500;
        err.cause = baseError;
        throw err;
      }

      linkedPlaces = placesBase ?? [];
    } else if (linkedError) {
      const err = new Error('음식점 검증 대상을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = linkedError;
      throw err;
    } else {
      linkedPlaces = placesWithVerified ?? [];
    }

    let verified = 0;
    let removed = 0;
    let skipped = 0;

    for (const place of linkedPlaces) {
      if (
        hasVerificationTimestamps &&
        !force &&
        !isVerificationDue(place.last_verified_at)
      ) {
        skipped += 1;
        continue;
      }

      const fresh = restaurantById.get(place.kakao_place_id);
      if (fresh) {
        const verifiedAt = nowIso();
        const updateError = await updateCampusPlace(supabase, place.id, {
          name: fresh.name,
          category: fresh.category,
          address: fresh.address,
          lat: fresh.lat,
          lng: fresh.lng,
          distance_m: fresh.distanceM,
          synced_at: verifiedAt,
          last_verified_at: verifiedAt,
        });

        if (updateError) {
          const err = new Error(`음식점 검증 갱신 실패 (${place.name})`);
          err.status = 500;
          err.cause = updateError;
          throw err;
        }

        verified += 1;
        continue;
      }

      const distanceM =
        place.lat != null && place.lng != null
          ? Math.round(
              distanceMeters(
                TOUR_SEARCH_CENTER.lat,
                TOUR_SEARCH_CENTER.lng,
                Number(place.lat),
                Number(place.lng),
              ),
            )
          : place.distance_m;

      if (distanceM > TOUR_SEARCH_RADIUS_M) {
        await removeStaleRestaurant(supabase, place);
        removed += 1;
        continue;
      }

      const exists = await verifyKakaoPlaceExists({
        kakaoPlaceId: place.kakao_place_id,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
      });

      if (exists) {
        const verifiedAt = nowIso();
        const updateError = await updateCampusPlace(supabase, place.id, {
          distance_m: distanceM,
          last_verified_at: verifiedAt,
        });

        if (updateError) {
          const err = new Error(`음식점 검증 표시 실패 (${place.name})`);
          err.status = 500;
          err.cause = updateError;
          throw err;
        }

        verified += 1;
        continue;
      }

      await removeStaleRestaurant(supabase, place);
      removed += 1;
    }

    return {
      ...syncResult,
      verified,
      removed,
      skipped,
      checkedAt: nowIso(),
    };
  },
};

module.exports = TourModel;
