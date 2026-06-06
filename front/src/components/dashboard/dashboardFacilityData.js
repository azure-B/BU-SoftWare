import {
  formatTimeSlots,
  loadStoredReservations,
  RESERVATION_STATUS,
  toDateInputValue,
} from '../reservation/reservationData';
import { API_BASE_URL } from '../constants';

function parseReservationSortTime(dateStr, timeSlots) {
  const firstSlot = timeSlots?.[0] ?? '00:00';
  const parsed = new Date(`${dateStr}T${firstSlot}:00`);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatDashboardTimeLabel(dateStr, timeSlots) {
  const firstSlot = timeSlots?.[0];
  if (!dateStr || !firstSlot) return '--';

  const date = new Date(`${dateStr}T00:00:00`);
  const today = toDateInputValue(new Date());
  const timeText = formatTimeSlots(timeSlots);

  if (dateStr === today) {
    return timeText;
  }

  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  return `${dateLabel} ${timeText}`;
}

export function mapStoredReservationToDashboardRow(reservation) {
  const sortTime = parseReservationSortTime(reservation.date, reservation.timeSlots);
  return {
    id: `local-${reservation.id}`,
    facilityId: reservation.facilityId,
    facilityName: reservation.facilityTitle,
    location: reservation.location ?? '',
    timeLabel: formatDashboardTimeLabel(reservation.date, reservation.timeSlots),
    sortTime: sortTime ?? Date.now(),
    status: 'booked',
    statusLabel: '예약됨',
    isMine: true,
  };
}

export function sortDashboardFacilityStatuses(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const isUpcomingReservation = (row) =>
    row.status === 'booked' || row.status === 'reserved';

  const reservations = list
    .filter(isUpcomingReservation)
    .sort((a, b) => {
      if (Boolean(a.isMine) !== Boolean(b.isMine)) {
        return a.isMine ? -1 : 1;
      }
      return (a.sortTime ?? 0) - (b.sortTime ?? 0);
    });

  const others = list
    .filter((row) => !isUpcomingReservation(row))
    .sort((a, b) => {
      if (a.status === 'available' && b.status === 'available') {
        return (a.facilityId ?? 0) - (b.facilityId ?? 0);
      }
      return (a.sortTime ?? 0) - (b.sortTime ?? 0);
    });

  return [...reservations, ...others];
}

export function mergeDashboardFacilityStatuses(apiRows, localReservations = loadStoredReservations()) {
  const nowMs = Date.now();
  const apiList = Array.isArray(apiRows) ? apiRows : [];

  const myLocalRows = (localReservations ?? [])
    .filter((reservation) => reservation.status === RESERVATION_STATUS.APPROVED)
    .map(mapStoredReservationToDashboardRow)
    .filter((row) => row.sortTime >= nowMs - 60 * 60 * 1000)
    .sort((a, b) => a.sortTime - b.sortTime);

  const coveredKeys = new Set(
    myLocalRows.map((row) => `${row.facilityId}|${row.timeLabel}`),
  );

  const myApiRows = apiList
    .filter((row) => row.isMine && (row.status === 'booked' || row.status === 'reserved'))
    .filter((row) => !coveredKeys.has(`${row.facilityId}|${row.timeLabel}`));

  const myRows = [...myLocalRows, ...myApiRows].sort((a, b) => a.sortTime - b.sortTime);

  const availableRows = apiList.filter((row) => row.status === 'available');

  const otherRows = apiList.filter(
    (row) =>
      !row.isMine &&
      row.status !== 'available' &&
      !myRows.some(
        (mine) =>
          String(mine.facilityId) === String(row.facilityId) && mine.sortTime === row.sortTime,
      ),
  );

  return sortDashboardFacilityStatuses([...myRows, ...availableRows, ...otherRows]);
}

export async function fetchDashboardFacilityStatuses(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/api/reservations/dashboard-status`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '시설 현황을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return mergeDashboardFacilityStatuses(Array.isArray(data) ? data : []);
}
