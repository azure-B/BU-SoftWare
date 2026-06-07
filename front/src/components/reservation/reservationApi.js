import { API_BASE_URL } from '../constants';

export async function fetchReservationFacilities(departmentId) {
  const id = Number(departmentId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('학과 정보가 없습니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/reservations/facilities?departmentId=${id}`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.message || '시설 목록을 불러오지 못했습니다.');
  }

  return body;
}

export async function fetchMyReservations(token) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/reservations/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || '예약 목록을 불러오지 못했습니다.');
  }

  return Array.isArray(body) ? body : [];
}

export async function fetchBookedSlots({ facilitySlug, date }) {
  const params = new URLSearchParams({
    facilitySlug: String(facilitySlug),
    date: String(date),
  });

  const res = await fetch(`${API_BASE_URL}/api/reservations/booked-slots?${params}`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.message || '예약된 시간을 불러오지 못했습니다.');
  }

  return Array.isArray(body.timeSlots) ? body.timeSlots : [];
}

export async function createReservation({
  token,
  facilitySlug,
  date,
  timeSlots,
}) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ facilitySlug, date, timeSlots }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || '예약 저장에 실패했습니다.');
  }

  return body;
}
