const { getServerClient } = require('../config/supabase');
const FacilityModel = require('./facilityModel');
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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';

  const now = new Date();
  const isToday =
    startOfLocalDayFromDate(date).getTime() === startOfLocalDayFromDate(now).getTime();
  const time = formatTimeLabel(iso);

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
      : `${facility.id}-${status}-${sortTime}`,
    facilityId: facility.id,
    facilityName: facility.name,
    location: facility.location,
    timeLabel: formatDashboardTimeLabel(timeIso),
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
  const status =
    row.status === 'APPROVED' || row.status === 'CONFIRMED' ? 'approved' : 'pending';

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
      .select('id, facility_id, user_id, start_time, end_time, status, facilities ( slug, name, location )')
      .eq('user_id', authorId)
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

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
        status: 'APPROVED',
      })
      .select('id, facility_id, user_id, start_time, end_time, status')
      .single();

    if (error) {
      const err = new Error('예약 저장에 실패했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return mapApiReservationRow(data, facility);
  },

  findDashboardStatus: async (userId = null) => {
    const now = new Date();
    const dayStart = startOfLocalDayFromDate(now);
    const dayEnd = endOfLocalDayFromDate(now);

    const supabase = getServerClient();

    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, location')
      .order('id', { ascending: true });

    if (facilitiesError) {
      const err = new Error('시설 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = facilitiesError;
      throw err;
    }

    if (!facilities?.length) return [];

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
    const facilityById = new Map(facilities.map((facility) => [facility.id, facility]));
    const userRows = [];

    if (userId) {
      for (const reservation of reservations ?? []) {
        if (reservation.user_id !== userId) continue;

        const facility = facilityById.get(reservation.facility_id);
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

    const userRowKeys = new Set(userRows.map((row) => `${row.facilityId}|${row.sortTime}`));

    const todayReservations = (reservations ?? []).filter((reservation) => {
      const startMs = new Date(reservation.start_time).getTime();
      const endMs = new Date(reservation.end_time).getTime();
      return endMs >= dayStart.getTime() && startMs <= dayEnd.getTime();
    });

    const todayByFacility = new Map();
    for (const reservation of todayReservations) {
      const list = todayByFacility.get(reservation.facility_id) ?? [];
      list.push(reservation);
      todayByFacility.set(reservation.facility_id, list);
    }

    const facilityRows = facilities.map((facility) => {
      const facilityReservations = (todayByFacility.get(facility.id) ?? []).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );

      const active = facilityReservations.find((reservation) => {
        const startMs = new Date(reservation.start_time).getTime();
        const endMs = new Date(reservation.end_time).getTime();
        return startMs <= nowMs && endMs > nowMs;
      });

      if (active) {
        const row = mapStatusRow(facility, {
          timeIso: active.start_time,
          status: 'reserved',
          statusLabel: '사용중',
          isMine: Boolean(userId && active.user_id === userId),
          reservationId: active.id,
        });
        if (!userRowKeys.has(`${row.facilityId}|${row.sortTime}`)) return row;
      }

      const upcomingToday = facilityReservations.find(
        (reservation) => new Date(reservation.start_time).getTime() > nowMs,
      );

      if (upcomingToday) {
        const row = mapStatusRow(facility, {
          timeIso: upcomingToday.start_time,
          status: 'booked',
          statusLabel: '예약됨',
          isMine: Boolean(userId && upcomingToday.user_id === userId),
          reservationId: upcomingToday.id,
        });
        if (!userRowKeys.has(`${row.facilityId}|${row.sortTime}`)) return row;
      }

      return mapStatusRow(facility, {
        timeIso: now.toISOString(),
        status: 'available',
        statusLabel: '예약가능',
        isMine: false,
      });
    });

    const availableRows = facilityRows.filter((row) => row.status === 'available');
    const otherRows = facilityRows.filter(
      (row) => row.status !== 'available' && !row.isMine,
    );

    return [
      ...userRows.sort((a, b) => a.sortTime - b.sortTime),
      ...availableRows.sort((a, b) => a.facilityId - b.facilityId),
      ...otherRows.sort((a, b) => a.sortTime - b.sortTime || a.facilityId - b.facilityId),
    ];
  },
};

module.exports = ReservationModel;
