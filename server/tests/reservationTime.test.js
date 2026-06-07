const {
  buildReservationWindow,
  isBookableDate,
  timeSlotsFromRange,
  validateTimeSlots,
} = require('../src/utils/reservationTime');

describe('reservationTime', () => {
  it('builds reservation window from consecutive slots', () => {
    const { start_time, end_time } = buildReservationWindow('2026-06-20', ['09:00', '10:00', '11:00']);
    expect(timeSlotsFromRange(start_time, end_time)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('validates time slot arrays', () => {
    expect(validateTimeSlots(['09:00'])).toBe(true);
    expect(validateTimeSlots([])).toBe(false);
    expect(validateTimeSlots(['9:00'])).toBe(false);
  });

  it('checks booking lead days', () => {
    const today = new Date('2026-06-07T12:00:00');
    expect(isBookableDate('2026-06-13', today)).toBe(false);
    expect(isBookableDate('2026-06-14', today)).toBe(true);
  });
});
