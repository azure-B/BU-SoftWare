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

function mapStatusRow(facility, { timeIso, status, statusLabel }) {
  return {
    id: `${facility.id}-${status}-${timeIso}`,
    facilityId: facility.id,
    facilityName: facility.name,
    location: facility.location,
    timeLabel: formatTimeLabel(timeIso),
    sortTime: new Date(timeIso).getTime(),
    status,
    statusLabel,
  };
}

const ReservationModel = {
  findDashboardStatus: async () => {
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
      .select('id, facility_id, start_time, end_time, status')
      .in('status', BLOCKING_STATUSES)
      .gte('end_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    if (reservationsError) {
      const err = new Error('예약 현황을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = reservationsError;
      throw err;
    }

    const nowMs = now.getTime();
    const byFacility = new Map();

    for (const reservation of reservations ?? []) {
      const list = byFacility.get(reservation.facility_id) ?? [];
      list.push(reservation);
      byFacility.set(reservation.facility_id, list);
    }

    const rows = facilities.map((facility) => {
      const facilityReservations = (byFacility.get(facility.id) ?? []).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );

      const active = facilityReservations.find((reservation) => {
        const startMs = new Date(reservation.start_time).getTime();
        const endMs = new Date(reservation.end_time).getTime();
        return startMs <= nowMs && endMs > nowMs;
      });

      if (active) {
        return mapStatusRow(facility, {
          timeIso: active.start_time,
          status: 'reserved',
          statusLabel: '사용중',
        });
      }

      const upcoming = facilityReservations.find(
        (reservation) => new Date(reservation.start_time).getTime() > nowMs,
      );

      if (upcoming) {
        return mapStatusRow(facility, {
          timeIso: upcoming.start_time,
          status: 'booked',
          statusLabel: '예약됨',
        });
      }

      return mapStatusRow(facility, {
        timeIso: now.toISOString(),
        status: 'available',
        statusLabel: '예약가능',
      });
    });

    return rows.sort((a, b) => a.sortTime - b.sortTime || a.facilityId - b.facilityId);
  },
};

module.exports = ReservationModel;
