import { API_BASE_URL } from '../constants';

async function parseJsonResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || '요청에 실패했습니다.');
  }
  return body;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAdminStats(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function fetchAdminNotices(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/notices`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function publishAdminNotice({ token, title, content, category, expiryDate }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/notices`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, content, category, expiryDate }),
  });
  return parseJsonResponse(res);
}

export async function updateAdminNotice({ token, noticeId, title, content, category, expiryDate }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/notices/${noticeId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ title, content, category, expiryDate }),
  });
  return parseJsonResponse(res);
}

export async function deleteAdminNotice({ token, noticeId }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/notices/${noticeId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function fetchAdminFacilities(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/facilities`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function registerAdminFacility({
  token,
  name,
  location,
  capacity,
  category,
  departmentName,
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/facilities`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      name,
      location,
      capacity,
      category,
      departmentName,
    }),
  });
  return parseJsonResponse(res);
}

export async function updateAdminFacility({
  token,
  facilityId,
  name,
  location,
  capacity,
  category,
  departmentName,
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/facilities/${facilityId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      name,
      location,
      capacity,
      category,
      departmentName,
    }),
  });
  return parseJsonResponse(res);
}

export async function deleteAdminFacility({ token, facilityId }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/facilities/${facilityId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function fetchAdminReservations(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/reservations`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function reviewAdminReservation({ token, reservationId, status, rejectReason }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/reservations/${reservationId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, rejectReason }),
  });
  return parseJsonResponse(res);
}
