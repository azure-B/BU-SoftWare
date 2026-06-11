/** 캠퍼스 셔틀 지도 시뮬레이션 — 시연용 24시간 (운행 시간표 UI와 분리) */

export const SHUTTLE_BUS_COUNT = 3;

export const SHUTTLE_SPEED_KMH = 28;

/** true: 지도에서 항상 버스 표시 (시연). false: CAMPUS_SHUTTLE_SCHEDULE 시간대만 표시 */
export const SHUTTLE_DEMO_24H = true;

const SHUTTLE_ROUTE_DEFS = {
  'dujeong-campus': {
    routeLabel: '백석대 ↔ 두정역',
    direction: 'forward',
    strokeColor: '#001e59',
  },
  'cheonan-campus': {
    routeLabel: '백석대 ↔ 천안역',
    direction: 'reverse',
    strokeColor: '#b8964e',
  },
};

/** 실제 운행 구간 (분 단위, 0=00:00) — SHUTTLE_DEMO_24H=false 일 때 사용 */
export const SHUTTLE_SERVICE_WINDOWS = {
  morning: {
    id: 'morning',
    label: '등교',
    routeLabel: '두정역 → 백석대',
    routeId: 'dujeong-campus',
    direction: 'forward',
    start: 7 * 60 + 50,
    end: 11 * 60 + 30,
  },
  afternoon: {
    id: 'afternoon',
    label: '하교',
    routeLabel: '백석대 → 천안역',
    routeId: 'cheonan-campus',
    direction: 'reverse',
    start: 13 * 60 + 30,
    end: 18 * 60,
    endFriday: 17 * 60 + 30,
  },
};

export const SHUTTLE_DEMO_PERIOD = {
  id: 'demo-allDay',
  label: '상시',
  start: 0,
  end: 24 * 60,
};

const BADGE_CLASSES = [
  'shuttle-bus-marker__badge--primary',
  'shuttle-bus-marker__badge--secondary',
  'shuttle-bus-marker__badge--navy',
];

const DEMO_BUS_ASSIGNMENTS = [
  { routeId: 'dujeong-campus', busIndex: 0 },
  { routeId: 'dujeong-campus', busIndex: 1 },
  { routeId: 'cheonan-campus', busIndex: 0 },
];

function getAfternoonEndMinutes(dayOfWeek) {
  const { end, endFriday } = SHUTTLE_SERVICE_WINDOWS.afternoon;
  return dayOfWeek === 5 ? endFriday : end;
}

export function getEffectiveMinutesOfDay(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function getActiveShuttlePeriod(now = new Date()) {
  const day = now.getDay();
  const minutes = getEffectiveMinutesOfDay(now);
  const { morning, afternoon } = SHUTTLE_SERVICE_WINDOWS;
  const afternoonEnd = getAfternoonEndMinutes(day);

  if (minutes >= morning.start && minutes < morning.end) {
    return { ...morning, end: morning.end };
  }

  if (day >= 1 && day <= 5 && minutes >= afternoon.start && minutes < afternoonEnd) {
    return { ...afternoon, end: afternoonEnd };
  }

  return null;
}

export function buildShuttleBuses(period) {
  if (SHUTTLE_DEMO_24H) {
    return DEMO_BUS_ASSIGNMENTS.map(({ routeId, busIndex }, index) => {
      const route = SHUTTLE_ROUTE_DEFS[routeId];
      return {
        id: String(index + 1),
        label: `${index + 1}호 · ${route.routeLabel}`,
        badgeClass: BADGE_CLASSES[index],
        routeId,
        direction: route.direction,
        busIndex,
        strokeColor: route.strokeColor,
      };
    });
  }

  return Array.from({ length: SHUTTLE_BUS_COUNT }, (_, index) => ({
    id: String(index + 1),
    label: `${index + 1}호 · ${period.routeLabel}`,
    badgeClass: BADGE_CLASSES[index],
    routeId: period.routeId,
    direction: period.direction,
    busIndex: index,
    strokeColor: '#001e59',
  }));
}

export function getShuttleSimulationState(now = new Date()) {
  if (SHUTTLE_DEMO_24H) {
    const period = SHUTTLE_DEMO_PERIOD;
    return {
      active: true,
      period,
      buses: buildShuttleBuses(period),
      effectiveMinutes: getEffectiveMinutesOfDay(now),
      effectiveNow: now,
      demo24h: true,
    };
  }

  const period = getActiveShuttlePeriod(now);

  if (!period) {
    return { active: false, period: null, buses: [], demo24h: false };
  }

  return {
    active: true,
    period,
    buses: buildShuttleBuses(period),
    effectiveMinutes: getEffectiveMinutesOfDay(now),
    effectiveNow: now,
    demo24h: false,
  };
}

export function getRouteStrokeColor(routeId) {
  return SHUTTLE_ROUTE_DEFS[routeId]?.strokeColor ?? '#001e59';
}

export function getShuttleStatusMessage(state) {
  if (!state?.active) {
    const day = new Date().getDay();
    const afternoonNote =
      day === 0 || day === 6
        ? '하교 주말 미운행'
        : day === 5
          ? '하교 금 13:30~17:30'
          : '하교 13:30~18:00';
    return `현재 운행 시간이 아닙니다 · ${afternoonNote}`;
  }

  if (state.demo24h) {
    return `상시 운행 중 · 두정역 · 천안역 노선 (${SHUTTLE_BUS_COUNT}대 · 24시간)`;
  }

  const { period } = state;
  const endHour = Math.floor(period.end / 60);
  const endMin = String(Math.floor(period.end % 60)).padStart(2, '0');
  return `${period.label} 운행 중 · ${period.routeLabel} (${SHUTTLE_BUS_COUNT}대 · ~${endHour}:${endMin}까지)`;
}

export function reversePath(path) {
  if (!path?.length) return [];
  return [...path].reverse();
}

export function routePathForBus(path, direction) {
  if (!path?.length) return [];
  return direction === 'reverse' ? reversePath(path) : path;
}
