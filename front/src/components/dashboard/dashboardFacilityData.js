import { API_BASE_URL } from '../constants';
import { clearStoredReservations } from '../reservation/reservationData';

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.id ?? `${row.facilityId}|${row.sortTime}|${row.location ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

export function mergeDashboardFacilityStatuses(apiRows) {
  const apiList = Array.isArray(apiRows) ? apiRows : [];

  const myRows = dedupeRows(
    apiList.filter(
      (row) => row.isMine && (row.status === 'booked' || row.status === 'reserved'),
    ),
  ).sort((a, b) => (a.sortTime ?? 0) - (b.sortTime ?? 0));

  const myFacilityIds = new Set(myRows.map((row) => String(row.facilityId)));

  const availableRows = apiList
    .filter((row) => row.status === 'available')
    .filter((row) => !myFacilityIds.has(String(row.facilityId)));

  return sortDashboardFacilityStatuses([...myRows, ...availableRows]);
}

export async function fetchDashboardFacilityStatuses(token, departmentId = null) {
  clearStoredReservations();

  const params = new URLSearchParams();
  if (departmentId != null && departmentId !== '') {
    params.set('departmentId', String(departmentId));
  }
  const query = params.toString();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(
    `${API_BASE_URL}/api/reservations/dashboard-status${query ? `?${query}` : ''}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '시설 현황을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return mergeDashboardFacilityStatuses(Array.isArray(data) ? data : []);
}
