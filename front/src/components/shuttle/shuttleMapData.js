/** 천안 하늘공원 장례식장 중심 — 카카오맵 level 6 ≈ 500m, level 7 ≈ 1km */
import { SHUTTLE_BUS_COUNT, getEffectiveMinutesOfDay } from './shuttleScheduleSim';

export const SHUTTLE_MAP_CENTER = { lat: 36.822067, lng: 127.158763 };
export const SHUTTLE_MAP_LEVEL = 6;
/** 모바일 셔틀 뷰 기본 반경 (km) — level 6·7 사이 ≈ 700m */
export const SHUTTLE_MAP_RADIUS_MOBILE_KM = 0.7;

const MOBILE_MAX_WIDTH = '(max-width: 767px)';

export function isMobileShuttleMap() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MAX_WIDTH).matches;
}

export function getShuttleMapRadiusBounds(center, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
  return {
    sw: { lat: center.lat - latDelta, lng: center.lng - lngDelta },
    ne: { lat: center.lat + latDelta, lng: center.lng + lngDelta },
  };
}

const DUJEONG = { lat: 36.83304, lng: 127.14785 };
const CHEONAN_STATION = { lat: 36.80642, lng: 127.14728 };
/** 백석대학교 셔틀 승차장(운동장 옆) — tourData TOUR_MAP_CENTER와 동일 권역 */
const BAEKSEOK = { lat: 36.8406135, lng: 127.1824946 };
const HANEUL_PARK = { lat: 36.822067, lng: 127.158763 };

/** 카카오 길찾기 요청 정의 (origin → destination) */
export const SHUTTLE_ROUTE_DEFS = {
  'dujeong-campus': {
    origin: DUJEONG,
    destination: BAEKSEOK,
  },
  'cheonan-campus': {
    origin: CHEONAN_STATION,
    destination: BAEKSEOK,
    waypoints: [HANEUL_PARK],
  },
  'campus-loop': {
    origin: DUJEONG,
    destination: BAEKSEOK,
    waypoints: [HANEUL_PARK],
  },
};

/** Directions API 실패 시 사용하는 도로 추정 경로 */
export const SHUTTLE_BUS_ROUTES_FALLBACK = {
  'dujeong-campus': [
    DUJEONG,
    { lat: 36.8321, lng: 127.1504 },
    { lat: 36.8295, lng: 127.1558 },
    { lat: 36.8272, lng: 127.1612 },
    { lat: 36.8268, lng: 127.1668 },
    { lat: 36.8294, lng: 127.1718 },
    { lat: 36.8328, lng: 127.1762 },
    { lat: 36.8362, lng: 127.1798 },
    { lat: 36.8388, lng: 127.1816 },
    BAEKSEOK,
  ],
  'cheonan-campus': [
    CHEONAN_STATION,
    { lat: 36.8098, lng: 127.1481 },
    { lat: 36.8146, lng: 127.1512 },
    { lat: 36.8189, lng: 127.1564 },
    HANEUL_PARK,
    { lat: 36.8252, lng: 127.1648 },
    { lat: 36.8298, lng: 127.1712 },
    { lat: 36.8334, lng: 127.1768 },
    { lat: 36.8372, lng: 127.1802 },
    { lat: 36.8394, lng: 127.1818 },
    BAEKSEOK,
  ],
  'campus-loop': [
    DUJEONG,
    { lat: 36.8315, lng: 127.1518 },
    { lat: 36.8284, lng: 127.1572 },
    HANEUL_PARK,
    { lat: 36.8262, lng: 127.1654 },
    { lat: 36.8306, lng: 127.1724 },
    { lat: 36.8342, lng: 127.1776 },
    { lat: 36.8376, lng: 127.1808 },
    BAEKSEOK,
  ],
};

function routeLengthKm(points) {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += haversineKm(points[i], points[i + 1]);
  }
  return total;
}

export function estimateTripDurationMs(path, speedKmh = 28) {
  const km = routeLengthKm(path);
  if (km === 0) return 20 * 60 * 1000;
  return (km / speedKmh) * 3600 * 1000;
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function lerpPoint(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

export function interpolateRouteByDistance(points, progress) {
  if (!points?.length) return SHUTTLE_MAP_CENTER;
  if (points.length === 1) return points[0];

  const clamped = Math.min(Math.max(progress, 0), 1);
  const segments = [];
  let total = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const length = haversineKm(points[i], points[i + 1]);
    segments.push(length);
    total += length;
  }

  if (total === 0) return points[0];

  let remaining = clamped * total;
  for (let i = 0; i < segments.length; i += 1) {
    if (remaining <= segments[i]) {
      return lerpPoint(points[i], points[i + 1], remaining / segments[i]);
    }
    remaining -= segments[i];
  }

  return points[points.length - 1];
}

export function getSimulatedBusPosition(bus, path, now = Date.now(), simulationState = null) {
  if (!simulationState?.active || !path?.length) return null;

  const { period } = simulationState;
  const routePath =
    bus.direction === 'reverse' ? [...path].reverse() : path;
  if (routePath.length < 2) return null;

  const tripDurationMs = estimateTripDurationMs(routePath);
  const phaseOffset = (bus.busIndex / SHUTTLE_BUS_COUNT) * tripDurationMs;

  const effective =
    simulationState.effectiveMinutes ??
    getEffectiveMinutesOfDay(now instanceof Date ? now : new Date(now));
  const elapsedMs = Math.max(0, (effective - period.start) * 60 * 1000);
  const elapsedOnRoute = (elapsedMs + phaseOffset) % tripDurationMs;
  const progress = elapsedOnRoute / tripDurationMs;

  return interpolateRouteByDistance(routePath, progress);
}
