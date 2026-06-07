const BOOKING_LEAD_DAYS = 7;
const MAX_TIME_SLOTS = 4;
const TIME_SLOT_PATTERN = /^\d{2}:\d{2}$/;

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinBookingDate(fromDate = new Date()) {
  const minDate = new Date(fromDate);
  minDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() + BOOKING_LEAD_DAYS);
  return toDateInputValue(minDate);
}

function isBookableDate(dateStr, fromDate = new Date()) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return dateStr >= getMinBookingDate(fromDate);
}

function parseTimeSlot(slot) {
  const [hours, minutes] = String(slot).split(':').map(Number);
  return { hours, minutes };
}

function formatHourMinute(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildReservationWindow(dateStr, timeSlots) {
  const sorted = [...timeSlots].sort();
  const start = parseTimeSlot(sorted[0]);
  const last = parseTimeSlot(sorted[sorted.length - 1]);

  const startDate = new Date(`${dateStr}T00:00:00`);
  startDate.setHours(start.hours, start.minutes, 0, 0);

  const endDate = new Date(`${dateStr}T00:00:00`);
  endDate.setHours(last.hours + 1, last.minutes, 0, 0);

  return {
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
  };
}

function timeSlotsFromRange(startIso, endIso) {
  const slots = [];
  const current = new Date(startIso);
  const end = new Date(endIso);

  while (current < end) {
    slots.push(formatHourMinute(current));
    current.setHours(current.getHours() + 1);
  }

  return slots;
}

function validateTimeSlots(timeSlots) {
  if (!Array.isArray(timeSlots)) return false;
  if (timeSlots.length < 1 || timeSlots.length > MAX_TIME_SLOTS) return false;
  return timeSlots.every((slot) => TIME_SLOT_PATTERN.test(String(slot)));
}

function startOfLocalDay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfLocalDay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(23, 59, 59, 999);
  return date;
}

module.exports = {
  BOOKING_LEAD_DAYS,
  MAX_TIME_SLOTS,
  toDateInputValue,
  getMinBookingDate,
  isBookableDate,
  buildReservationWindow,
  timeSlotsFromRange,
  validateTimeSlots,
  startOfLocalDay,
  endOfLocalDay,
  formatHourMinute,
};
