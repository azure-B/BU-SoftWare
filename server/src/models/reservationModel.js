const { getServerClient } = require('../config/supabase');
const FacilityModel = require('./facilityModel');
const {
  normalizeReservationStatus,
  pickRejectReason,
} = require('../utils/reservationStatus');
const {
  buildReservationWindow,
  endOfLocalDay,
  isBookableDate,
  startOfLocalDay,
  timeSlotsFromRange,
  toDateInputValue,
  validateTimeSlots,
} = require('../utils/reservationTime');

const BLOCKING_STATUSES = ['APPROVED', 'CONFIRMED', 'PENDING'];

function formatTimeLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDashboardTimeLabel(iso) {
  return formatDashboardTimeLabelFromIso(iso);
}

function formatDashboardTimeLabelFromIso(timeIso) {
  if (!timeIso) return '--:--';
  const date = new Date(timeIso);
  if (Number.isNaN(date.getTime())) return '--:--';

  const now = new Date();
  const isToday = startOfLocalDayFromDate(date).getTime() === startOfLocalDayFromDate(now).getTime();
  const time = formatTimeLabel(timeIso);

  if (isToday) return time;

  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  return `${dateLabel} ${time}`;
}

function startOfLocalDayFromDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDayFromDate(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function mapStatusRow(facility, { timeIso, status, statusLabel, isMine = false, reservationId = null }) {
  const sortTime = new Date(timeIso).getTime();
  return {
    id: reservationId
      ? `reservation-${reservationId}`
      : `available-${facility.id}`,
    facilityId: facility.id,
    facilitySlug: facility.slug ?? null,
    facilityName: facility.name,
    location: facility.location,
    timeLabel: formatDashboardTimeLabelFromIso(timeIso),
    sortTime,
    status,
    statusLabel,
    isMine,
  };
}

function mapApiReservationRow(row, facility) {
  const slug = facility.slug ?? String(facility.dbId ?? facility.id);
  const date = toDateInputValue(new Date(row.start_time));
  const timeSlots = timeSlotsFromRange(row.start_time, row.end_time);
  const status = normalizeReservationStatus(row.status);

  return {
    id: String(row.id),
    facilityId: slug,
    facilityTitle: facility.name ?? facility.title,
    location: facility.location ?? '',
    date,
    timeSlots,
    participants: null,
    reason: null,
    status,
    rejectReason: pickRejectReason(row),
    createdAt: row.created_at ?? row.start_time,
  };
}

async function assertUserCanBookFacility(supabase, facility, userId) {
  if (facility.category !== 'dept' || !facility.departmentId) return;

  const { data: user, error } = await supabase
    .from('users')
    .select('department_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    const err = new Error('사용자 정보를 확인하지 못했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  if (user?.department_id !== facility.departmentId) {
    const err = new Error('소속 학과 시설만 예약할 수 있습니다.');
    err.status = 403;
    throw err;
  }
}

async function resolveFacilityRecord(facilitySlug) {
  return FacilityModel.findFacilityBySlug(facilitySlug);
}

function filterCanonicalFacilities(facilities) {
  const namesWithSlug = new Set(
    (facilities ?? []).filter((facility) => facility.slug).map((facility) => facility.name),
  );

  return (facilities ?? []).filter(
    (facility) => facility.slug || !namesWithSlug.has(facility.name),
  );
}

async function hasReservationConflict(supabase, facilityId, startIso, endIso) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('facility_id', facilityId)
    .in('status', BLOCKING_STATUSES)
    .lt('start_time', endIso)
    .gt('end_time', startIso);

  if (error) {
    const err = new Error('예약 충돌 여부를 확인하지 못했습니다.');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  return (data ?? []).length > 0;
}

const ReservationModel = {
  findMyReservations: async (userId) => {
    const authorId = Number(userId);
    if (!Number.isInteger(authorId) || authorId < 1) {
      const err = new Error('유효하지 않은 사용자입니다.');
      err.status = 401;
      throw err;
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('reservations')
      .select(
        'id, facility_id, user_id, start_time, end_time, status, N_reason, facilities ( slug, name, location )',
      )
      .eq('user_id', authorId)
      .order('start_time', { ascending: false })
      .limit(100);

    if (error) {
      const err = new Error('예약 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? [])
      .filter((row) => row.facilities)
      .map((row) =>
        mapApiReservationRow(row, {
          slug: row.facilities.slug,
          name: row.facilities.name,
          location: row.facilities.location,
        }),
      );
  },

  findBookedSlots: async ({ facilitySlug, date }) => {
    if (!isBookableDate(date) && date) {
      // 과거·당일 조회는 허용, 예약 불가일만 막지 않음
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) {
      const err = new Error('유효하지 않은 예약 일자입니다.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const facility = await resolveFacilityRecord(facilitySlug);
    const dayStart = startOfLocalDay(date);
    const dayEnd = endOfLocalDay(date);

    const { data, error } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .eq('facility_id', facility.dbId)
      .in('status', BLOCKING_STATUSES)
      .lt('start_time', dayEnd.toISOString())
      .gt('end_time', dayStart.toISOString());

    if (error) {
      const err = new Error('예약된 시간을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    const slots = new Set();
    for (const row of data ?? []) {
      for (const slot of timeSlotsFromRange(row.start_time, row.end_time)) {
        slots.add(slot);
      }
    }

    return [...slots].sort();
  },

  createReservation: async ({ userId, facilitySlug, date, timeSlots }) => {
    const authorId = Number(userId);
    if (!Number.isInteger(authorId) || authorId < 1) {
      const err = new Error('유효하지 않은 사용자입니다.');
      err.status = 401;
      throw err;
    }

    if (!isBookableDate(date)) {
      const err = new Error('예약은 최소 7일 전에 신청해 주세요.');
      err.status = 400;
      throw err;
    }

    if (!validateTimeSlots(timeSlots)) {
      const err = new Error('사용 시간을 1~4개 선택해 주세요.');
      err.status = 400;
      throw err;
    }

    const supabase = getServerClient();
    const facility = await resolveFacilityRecord(facilitySlug);
    await assertUserCanBookFacility(supabase, facility, authorId);

    const { start_time, end_time } = buildReservationWindow(date, timeSlots);

    const conflict = await hasReservationConflict(
      supabase,
      facility.dbId,
      start_time,
      end_time,
    );

    if (conflict) {
      const err = new Error('이미 예약된 시간이 포함되어 있습니다.');
      err.status = 409;
      throw err;
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        facility_id: facility.dbId,
        user_id: authorId,
        start_time,
        end_time,
        status: 'PENDING',
      })
      .select('id, facility_id, user_id, start_time, end_time, status, N_reason')
      .single();

    if (error) {
      const err = new Error('예약 저장에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapApiReservationRow(data, facility);
  },

  findDashboardStatus: async (userId = null, departmentId = null) => {
    const now = new Date();

    const supabase = getServerClient();

    const canonicalFacilities = await FacilityModel.findCanonicalFacilityRowsForDepartment(
      departmentId,
    );

    if (!canonicalFacilities.length) return [];

    const fullFacilityById = new Map(
      canonicalFacilities.map((facility) => [facility.id, facility]),
    );

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, facility_id, user_id, start_time, end_time, status')
      .in('status', BLOCKING_STATUSES)
      .gte('end_time', now.toISOString())
      .order('start_time', { ascending: true });

    if (reservationsError) {
      const err = new Error('예약 현황을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = reservationsError;
      throw err;
    }

    const nowMs = now.getTime();
    const userRows = [];

    if (userId) {
      for (const reservation of reservations ?? []) {
        if (reservation.user_id !== userId) continue;

        const facility =
          fullFacilityById.get(reservation.facility_id) ??
          canonicalFacilities.find((row) => row.id === reservation.facility_id);
        if (!facility) continue;

        const startMs = new Date(reservation.start_time).getTime();
        const endMs = new Date(reservation.end_time).getTime();
        const isActive = startMs <= nowMs && endMs > nowMs;

        userRows.push(
          mapStatusRow(facility, {
            timeIso: reservation.start_time,
            status: isActive ? 'reserved' : 'booked',
            statusLabel: isActive ? '사용중' : '예약됨',
            isMine: true,
            reservationId: reservation.id,
          }),
        );
      }
    }

    const myFacilityIds = new Set(userRows.map((row) => row.facilityId));

    const availableRows = canonicalFacilities
      .filter((facility) => !myFacilityIds.has(facility.id))
      .map((facility) =>
        mapStatusRow(facility, {
          timeIso: now.toISOString(),
          status: 'available',
          statusLabel: '예약가능',
          isMine: false,
        }),
      );

    return [
      ...userRows.sort((a, b) => a.sortTime - b.sortTime),
      ...availableRows.sort((a, b) => a.facilityId - b.facilityId),
    ];
  },
};

module.exports = ReservationModel;
