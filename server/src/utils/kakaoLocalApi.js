const { TOUR_SEARCH_CENTER, TOUR_SEARCH_RADIUS_M } = require('./tourConstants');

function getKakaoRestApiKey() {
  return (
    process.env.KAKAO_REST_API_KEY ||
    process.env.KAKAO_MAP_APP_KEY ||
    process.env.REACT_APP_KAKAO_MAP_APP_KEY ||
    'f883af0deb606aebe88c391add89714f'
  );
}

function mapKakaoPlace(doc) {
  const categoryName = String(doc.category_name ?? '');
  let category = '음식점';
  if (categoryName.includes('카페')) category = '카페';

  return {
    kakaoPlaceId: String(doc.id),
    name: String(doc.place_name ?? '').trim(),
    category,
    address: String(doc.road_address_name || doc.address_name || '').trim(),
    lat: Number(doc.y),
    lng: Number(doc.x),
    distanceM: Number(doc.distance ?? 0),
  };
}

function getFallbackRestaurants() {
  const { lat, lng } = TOUR_SEARCH_CENTER;
  return [
    {
      kakaoPlaceId: 'fallback-ttukbaegi',
      name: '안서동 뚝배기',
      category: '음식점',
      address: '충청남도 천안시 동남구 안서동',
      lat: lat + 0.0012,
      lng: lng + 0.0008,
      distanceM: 180,
    },
    {
      kakaoPlaceId: 'fallback-libre',
      name: '카페 리브르',
      category: '카페',
      address: '충청남도 천안시 동남구 안서동',
      lat: lat - 0.0009,
      lng: lng + 0.0011,
      distanceM: 240,
    },
    {
      kakaoPlaceId: 'fallback-chicken',
      name: '안서동 치킨',
      category: '음식점',
      address: '충청남도 천안시 동남구 안서동',
      lat: lat + 0.0005,
      lng: lng - 0.0013,
      distanceM: 310,
    },
    {
      kakaoPlaceId: 'fallback-noodle',
      name: '할머니 손칼국수',
      category: '음식점',
      address: '충청남도 천안시 동남구 안서동',
      lat: lat - 0.0014,
      lng: lng - 0.0006,
      distanceM: 420,
    },
    {
      kakaoPlaceId: 'fallback-blueport',
      name: '블루포트',
      category: '카페',
      address: '충청남도 천안시 동남구 안서동',
      lat: lat + 0.0018,
      lng: lng - 0.0004,
      distanceM: 520,
    },
  ];
}

async function searchRestaurantsNearCenter({ lng, lat, radiusM = TOUR_SEARCH_RADIUS_M } = {}) {
  const apiKey = getKakaoRestApiKey();
  if (!apiKey) {
    return getFallbackRestaurants();
  }

  const centerLng = lng ?? TOUR_SEARCH_CENTER.lng;
  const centerLat = lat ?? TOUR_SEARCH_CENTER.lat;
  const collected = [];
  const seen = new Set();

  for (let page = 1; page <= 3; page += 1) {
    const url = new URL('https://dapi.kakao.com/v2/local/search/category.json');
    url.searchParams.set('category_group_code', 'FD6');
    url.searchParams.set('x', String(centerLng));
    url.searchParams.set('y', String(centerLat));
    url.searchParams.set('radius', String(radiusM));
    url.searchParams.set('sort', 'distance');
    url.searchParams.set('size', '15');
    url.searchParams.set('page', String(page));

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 401 || res.status === 403) {
        console.warn(
          'Kakao REST API 인증 실패 — REST API 키(KAKAO_REST_API_KEY) 확인 후 재시도하세요. 폴백 데이터를 사용합니다.',
        );
        return getFallbackRestaurants();
      }
      throw new Error(`카카오 장소 검색 실패 (${res.status}): ${body}`);
    }

    const payload = await res.json();
    const documents = payload.documents ?? [];
    if (documents.length === 0) break;

    for (const doc of documents) {
      const mapped = mapKakaoPlace(doc);
      if (!mapped.name || seen.has(mapped.kakaoPlaceId)) continue;
      seen.add(mapped.kakaoPlaceId);
      collected.push(mapped);
    }

    if (payload.meta?.is_end) break;
  }

  return collected.sort((a, b) => a.distanceM - b.distanceM);
}

async function verifyKakaoPlaceExists({ kakaoPlaceId, name, lat, lng }) {
  if (!kakaoPlaceId || String(kakaoPlaceId).startsWith('fallback-')) {
    return false;
  }

  const apiKey = getKakaoRestApiKey();
  if (!apiKey || !name || lat == null || lng == null) {
    return true;
  }

  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.searchParams.set('query', String(name).trim());
  url.searchParams.set('x', String(lng));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('radius', '200');
  url.searchParams.set('size', '15');

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    console.warn(`카카오 장소 확인 실패 (${kakaoPlaceId}): HTTP ${res.status}`);
    return true;
  }

  const payload = await res.json();
  return (payload.documents ?? []).some((doc) => String(doc.id) === String(kakaoPlaceId));
}

module.exports = {
  getKakaoRestApiKey,
  getFallbackRestaurants,
  searchRestaurantsNearCenter,
  verifyKakaoPlaceExists,
  mapKakaoPlace,
};
