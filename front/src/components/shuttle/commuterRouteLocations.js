/** 통학버스 노선별 승차 위치 (카카오 장소 검색 기준 대표 좌표) */

export const COMMUTER_ROUTE_LOCATIONS = {
  yeongdeungpo: {
    level: 4,
    stops: [{ lat: 37.52637, lng: 126.92538, label: '영등포 로터리 5번 출구 신한은행 앞' }],
  },
  gyodae: {
    level: 4,
    stops: [
      { lat: 37.49358, lng: 127.01447, label: '교대역 8번 출구' },
      { lat: 37.49452, lng: 127.01563, label: '교대역 14번 출구(세연타워)' },
    ],
  },
  jamsil: {
    level: 4,
    stops: [{ lat: 37.51395, lng: 127.10062, label: '잠실역 4번 출구 (롯데마트) 앞' }],
  },
  bundang: {
    level: 4,
    stops: [{ lat: 37.41109, lng: 127.12872, label: '야탑역 4번 출구 택시승강장' }],
  },
  'incheon-songnae': {
    level: 5,
    stops: [
      { lat: 37.43486, lng: 126.69078, label: '문학경기장역 1번 출구' },
      { lat: 37.48758, lng: 126.75312, label: '송내(남부역) 1번 출구' },
    ],
  },
  ansan: {
    level: 5,
    stops: [
      { lat: 37.31702, lng: 126.83862, label: '중앙역 1번 출구 택시승차장' },
      { lat: 37.30284, lng: 126.86652, label: '상록수역 3번 출구 롯데리아 앞' },
    ],
  },
  anyang: {
    level: 5,
    stops: [
      { lat: 37.40155, lng: 126.92287, label: '안양역 공영주차장 앞' },
      { lat: 37.38987, lng: 126.95072, label: '범계역 4번 출구 택시승강장' },
    ],
  },
  suwon: {
    level: 5,
    stops: [
      { lat: 37.25158, lng: 127.07142, label: '영통입구 버스정류장' },
      { lat: 37.26602, lng: 127.00015, label: '수원 T/G 입구 정류장' },
      { lat: 37.20738, lng: 127.05262, label: '동탄 이마트 버스정류장' },
      { lat: 37.27462, lng: 126.95548, label: '법원사거리 쉐보레매장 앞' },
    ],
  },
  yongin: {
    level: 5,
    stops: [
      { lat: 37.23368, lng: 127.20358, label: '용인 시외버스터미널' },
      { lat: 37.23742, lng: 127.19024, label: '명지대 사거리 삼성디지털 앞' },
      { lat: 37.26952, lng: 127.13248, label: '강남대 삼거리' },
      { lat: 37.28618, lng: 127.11162, label: '신갈 고속시외버스 정류소' },
    ],
  },
  'suwon-byeongjeong': {
    level: 6,
    stops: [
      { lat: 37.26582, lng: 127.00002, label: '수원역 파출소 앞' },
      { lat: 37.24752, lng: 127.02862, label: '병점 홈플러스 정류장' },
      { lat: 37.14982, lng: 127.07142, label: '오산역 환승센터 앞' },
      { lat: 36.99402, lng: 127.08582, label: '평택대 입구 GS25 앞' },
      { lat: 36.97242, lng: 127.03162, label: '평택 안성스타필드 정류장' },
    ],
  },
  jukjeon: {
    level: 5,
    stops: [{ lat: 37.32482, lng: 127.10972, label: '죽전 간이정류장 (고속도로)' }],
  },
  asan: {
    level: 6,
    stops: [
      { lat: 36.78928, lng: 127.00238, label: '아산시외버스터미널(모종환승장)' },
      { lat: 36.78242, lng: 127.01052, label: '아산이마트 옆 LG전자' },
      { lat: 36.77762, lng: 127.05282, label: '배방역 사거리' },
    ],
  },
};

export function getCommuterRouteLocation(routeId) {
  return COMMUTER_ROUTE_LOCATIONS[routeId] ?? null;
}

export function hasCommuterRouteLocation(routeId) {
  return Boolean(getCommuterRouteLocation(routeId)?.stops?.length);
}
