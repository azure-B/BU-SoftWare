const { getServerClient } = require('../config/supabase');

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
  const isToday = startOfLocalDay(date).getTime() === startOfLocalDay(now).getTime();
  const time = formatTimeLabel(iso);

  if (isToday) return time;

  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  return `${dateLabel} ${time}`;
}

function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date) {
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

const ReservationModel = {
  findDashboardStatus: async (userId = null) => {
    const now = new Date();
    const dayStart = startOfLocalDay(now);
    const dayEnd = endOfLocalDay(now);

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
