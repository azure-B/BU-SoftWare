import { useEffect, useMemo, useState } from 'react';
import {
  BOOKING_LEAD_DAYS,
  getBookedTimeSlots,
  getFacilityBookingMeta,
  getMinBookingDate,
  getTimeSlotsWithAvailability,
  isBookableDate,
} from '../components/reservation/reservationData';
import { fetchBookedSlots } from '../components/reservation/reservationApi';
import '../public/css/reservation-in.css';

const MAX_TIME_SLOTS = 4;

function ReservationBooking({
  facility,
  existingReservations = [],
  token,
  submitting = false,
  onCancel,
  onSubmit,
}) {
  const booking = getFacilityBookingMeta(facility);
  const minBookingDate = getMinBookingDate();
  const [reservationDate, setReservationDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [participants, setParticipants] = useState('');
  const [reason, setReason] = useState('');
  const [apiBookedSlots, setApiBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!reservationDate) {
      setApiBookedSlots([]);
      return undefined;
    }

    let cancelled = false;
    setSlotsLoading(true);

    fetchBookedSlots({ facilitySlug: facility.id, date: reservationDate })
      .then((slots) => {
        if (!cancelled) setApiBookedSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setApiBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservationDate, facility.id]);

  const bookedSlots = useMemo(() => {
    const localSlots = getBookedTimeSlots(existingReservations, facility.id, reservationDate);
    return [...new Set([...localSlots, ...apiBookedSlots])];
  }, [existingReservations, facility.id, reservationDate, apiBookedSlots]);

  const displaySlots = useMemo(
    () => getTimeSlotsWithAvailability(booking.timeSlots, bookedSlots),
    [booking.timeSlots, bookedSlots],
  );

  const capacityLabel = booking.location
    ? `최대 ${booking.maxParticipants}명 / ${booking.location}`
    : `최대 ${booking.maxParticipants}명`;

  useEffect(() => {
    setSelectedSlots((prev) => prev.filter((slot) => !bookedSlots.includes(slot)));
  }, [bookedSlots]);

  const handleDateChange = (nextDate) => {
    setReservationDate(nextDate);
    setSelectedSlots([]);
  };

  const handleSlotChange = (value, checked, disabled) => {
    if (disabled) return;

    setSelectedSlots((prev) => {
      if (!checked) return prev.filter((slot) => slot !== value);
      if (prev.length >= MAX_TIME_SLOTS) return prev;
      return [...prev, value].sort();
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!reservationDate || selectedSlots.length === 0 || !participants || !reason.trim()) {
      window.alert('모든 필수 항목을 입력해 주세요.');
      return;
    }

    if (!isBookableDate(reservationDate)) {
      window.alert(`예약은 최소 ${BOOKING_LEAD_DAYS}일 전에 신청해 주세요.`);
      return;
    }

    const hasBookedSlot = selectedSlots.some((slot) => bookedSlots.includes(slot));
    if (hasBookedSlot) {
      window.alert('이미 예약된 시간이 포함되어 있습니다. 시간을 다시 선택해 주세요.');
      return;
    }

    onSubmit?.({
      facilityId: facility.id,
      date: reservationDate,
      timeSlots: selectedSlots,
      participants: Number(participants),
      reason: reason.trim(),
    });
  };

  return (
    <main className="flex-1 pb-16">
      <header className="reservation-in-header mb-12 pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary-container mb-2">
            시설 예약 신청
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {facility.title}
            {booking.subtitle ? ` (${booking.subtitle})` : ''}
          </p>
          <p className="font-body-md text-sm text-on-surface-variant mt-2">
            예약 가능일: {minBookingDate}부터 (최소 {BOOKING_LEAD_DAYS}일 전 신청)
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-label-md text-[12px] text-outline uppercase tracking-widest mb-1">
            Capacity
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">{capacityLabel}</p>
        </div>
      </header>

      <form className="space-y-12" onSubmit={handleSubmit}>
        <section>
          <h3 className="font-headline-md text-[20px] text-primary-container mb-6 flex items-center gap-2">
            <span className="text-on-tertiary-container font-serif italic">1.</span> Date &amp; Time
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2 relative">
              <label
                className="block font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant mb-1"
                htmlFor="reservation-date"
              >
                예약 일자
              </label>
              <input
                className="reservation-in-input w-full bg-transparent border-0 focus:ring-0 transition-all px-0 font-body-md text-on-surface"
                id="reservation-date"
                type="date"
                required
                min={minBookingDate}
                value={reservationDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant mb-3">
                사용 시간 (최대 4시간)
              </label>
              {!reservationDate ? (
                <p className="font-body-md text-sm text-on-surface-variant">
                  예약 일자를 먼저 선택해 주세요.
                </p>
              ) : slotsLoading ? (
                <p className="font-body-md text-sm text-on-surface-variant">
                  예약 가능 시간을 확인하는 중…
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {displaySlots.map((slot) =>
                    slot.disabled ? (
                      <div
                        key={slot.value}
                        className="reservation-in-time-slot reservation-in-time-slot--disabled text-center py-2 font-body-md text-[14px]"
                        title={bookedSlots.includes(slot.value) ? '이미 예약됨' : undefined}
                      >
                        {slot.value}
                      </div>
                    ) : (
                      <label key={slot.value} className="cursor-pointer">
                        <input
                          className="peer sr-only"
                          type="checkbox"
                          name="time-slot"
                          value={slot.value}
                          checked={selectedSlots.includes(slot.value)}
                          onChange={(e) =>
                            handleSlotChange(slot.value, e.target.checked, slot.disabled)
                          }
                        />
                        <div className="reservation-in-time-slot text-center py-2 font-body-md text-[14px] text-on-surface-variant peer-checked:bg-primary-container peer-checked:text-on-primary peer-checked:border-primary-container transition-colors hover:bg-surface-variant">
                          {slot.value}
                        </div>
                      </label>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <hr className="border-t border-surface-variant" />

        <section>
          <h3 className="font-headline-md text-[20px] text-primary-container mb-6 flex items-center gap-2">
            <span className="text-on-tertiary-container font-serif italic">2.</span> Details
          </h3>
          <div className="space-y-8">
            <div>
              <label
                className="block font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant mb-1"
                htmlFor="participants"
              >
                사용 인원
              </label>
              <div className="relative w-full md:w-1/3">
                <input
                  className="reservation-in-input w-full bg-transparent border-0 focus:ring-0 transition-all px-0 font-body-md text-on-surface"
                  id="participants"
                  type="number"
                  min="1"
                  max={booking.maxParticipants}
                  placeholder="예: 5"
                  required
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                />
                <span className="absolute right-0 top-3 text-outline font-body-md text-[14px]">명</span>
              </div>
            </div>

            <div>
              <label
                className="block font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant mb-1"
                htmlFor="reason"
              >
                사용 목적
              </label>
              <textarea
                className="reservation-in-input w-full bg-transparent border-0 focus:ring-0 transition-all px-0 font-body-md text-on-surface"
                id="reason"
                rows={1}
                placeholder="행사명 또는 모임의 구체적인 목적을 기재해주세요."
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="pt-8 flex flex-col-reverse sm:flex-row justify-end gap-4">
          <button
            type="button"
            className="reservation-in-btn-cancel px-8 py-3 font-label-md transition-colors"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="submit"
            className="reservation-in-btn-submit px-8 py-3 font-label-md transition-colors"
            disabled={submitting || !token}
          >
            {submitting ? '저장 중…' : '신청하기'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default ReservationBooking;
