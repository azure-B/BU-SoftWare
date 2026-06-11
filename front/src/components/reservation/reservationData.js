export const MY_RESERVATIONS_ID = 'my_reservations';

export const RESERVATION_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

export const RESERVATION_STATUS_LABEL = {
  [RESERVATION_STATUS.APPROVED]: '승인',
  [RESERVATION_STATUS.PENDING]: '예약 신청',
  [RESERVATION_STATUS.REJECTED]: '반려',
};

export const MY_RESERVATIONS_STORAGE_KEY = 'baekseok-my-reservations';
export const RESERVATIONS_UPDATED_EVENT = 'baekseok-reservations-updated';

export const BOOKING_LEAD_DAYS = 7;

export const FACILITY_CATEGORIES = [
  { id: 'startup', label: '창업지원단', icon: 'business_center' },
  { id: 'student', label: '학생처', icon: 'school' },
  { id: 'dept', label: '소속 학과', icon: 'account_balance' },
  { id: 'futsal', label: '풋살장', icon: 'sports_soccer' },
];

export const FACILITIES_BY_CATEGORY = {
  startup: [
    {
      id: 'coworking',
      title: '코워킹 스페이스',
      available: true,
      description:
        '다양한 팀이 함께 아이디어를 나누고 작업할 수 있는 오픈 스페이스입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 20명' },
        { icon: 'wifi', text: '구비 시설: 초고속 와이파이, 화이트보드, 공용 복합기' },
      ],
    },
    {
      id: 'meeting-a',
      title: '회의실 A',
      available: false,
      description:
        '소규모 팀 회의 및 프레젠테이션 연습에 적합한 독립된 회의 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 6명' },
        { icon: 'tv', text: '구비 시설: 대형 모니터, HDMI 케이블, 화이트보드' },
      ],
      unavailableReason: '현재 전체 예약 마감',
    },
    {
      id: 'seminar',
      title: '세미나실',
      available: true,
      description:
        '특강, 워크숍, 대규모 발표를 위한 계단식 또는 평면 세미나 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 40명' },
        { icon: 'videocam', text: '구비 시설: 빔 프로젝터, 음향 장비, 단상' },
      ],
    },
  ],
  student: [
    {
      id: 'counseling-room',
      title: '학생상담실',
      available: true,
      description:
        '학업·진로·심리 상담을 위한 1:1 및 소그룹 상담 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 4명' },
        { icon: 'lock', text: '구비 시설: 음향 차단, 상담 기록용 PC' },
      ],
    },
    {
      id: 'club-room',
      title: '동아리 활동실',
      available: true,
      description:
        '학생 동아리 정기 모임, 연습, 소규모 공연 리허설에 이용할 수 있는 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 30명' },
        { icon: 'music_note', text: '구비 시설: 음향 장비, 거울 벽, 이동식 의자' },
      ],
    },
    {
      id: 'student-lounge',
      title: '학생회관 다목적실',
      available: false,
      description:
        '학생회 행사, OT, 설명회 등 대규모 학생 행사를 위한 다목적 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 80명' },
        { icon: 'event', text: '구비 시설: 무대, 빔 프로젝터, 좌석 80석' },
      ],
      unavailableReason: '행사 일정으로 일시 중단',
    },
  ],
  dept: [
    {
      id: 'software-lab',
      title: '소프트웨어학과 실습실',
      available: true,
      description:
        '프로그래밍 실습, 팀 프로젝트 개발을 위한 학과 전용 PC 실습실입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 24명' },
        { icon: 'computer', text: '구비 시설: 개발용 PC 24대, 듀얼 모니터, Git 서버' },
      ],
    },
    {
      id: 'dept-seminar',
      title: '학과 세미나실',
      available: true,
      description:
        '학과 세미나, 졸업 논문 발표, 교수·학생 회의를 위한 세미나 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 20명' },
        { icon: 'videocam', text: '구비 시설: 빔 프로젝터, 전자칠판, 마이크' },
      ],
    },
    {
      id: 'project-room',
      title: '팀 프로젝트룸',
      available: false,
      description:
        '캡스톤·졸업작품 팀이 장기간 사용할 수 있는 독립 프로젝트 공간입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 8명' },
        { icon: 'developer_board', text: '구비 시설: 화이트보드, 회의 테이블, Wi-Fi' },
      ],
      unavailableReason: '학기 중 장기 배정',
    },
  ],
  futsal: [
    {
      id: 'futsal-a',
      title: '풋살장 A구역',
      available: true,
      description:
        '인조 잔디 구장으로 동아리 연습 및 친선 경기에 이용할 수 있습니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 10명 (5vs5)' },
        { icon: 'sports', text: '구비 시설: 조명, 골대, 벤치, 샤워실(인근)' },
      ],
    },
    {
      id: 'futsal-b',
      title: '풋살장 B구역',
      available: false,
      description:
        '실내 풋살장으로 날씨와 관계없이 이용 가능한 실내 구역입니다.',
      amenities: [
        { icon: 'groups', text: '수용 인원: 10명 (5vs5)' },
        { icon: 'ac_unit', text: '구비 시설: 에어컨, 실내 조명, 탈의실' },
      ],
      unavailableReason: '시설 점검으로 일시 중단',
    },
  ],
};

export const CATEGORY_SECTION_TITLES = {
  startup: '창업지원단 공간',
  student: '학생처 시설',
  dept: '소속 학과 시설',
  futsal: '풋살장',
};

export const DEFAULT_TIME_SLOTS = [
  { value: '09:00' },
  { value: '10:00' },
  { value: '11:00', disabled: true },
  { value: '12:00', disabled: true },
  { value: '13:00' },
  { value: '14:00' },
  { value: '15:00' },
  { value: '16:00' },
];

const FACILITY_BOOKING_META = {
  coworking: { subtitle: 'Coworking Space', location: '본관 3층 302호', maxParticipants: 20 },
  'meeting-a': { subtitle: 'Meeting Room A', location: '창업지원단 2층 201호', maxParticipants: 6 },
  seminar: { subtitle: 'Seminar Room', location: '창업지원단 1층 105호', maxParticipants: 40 },
  'counseling-room': { subtitle: 'Counseling Room', location: '학생회관 2층', maxParticipants: 4 },
  'club-room': { subtitle: 'Club Activity Room', location: '학생회관 3층', maxParticipants: 30 },
  'student-lounge': { subtitle: 'Multi-purpose Hall', location: '학생회관 1층', maxParticipants: 80 },
  'software-lab': { subtitle: 'Software Lab', location: '공학관 4층 401호', maxParticipants: 24 },
  'dept-seminar': { subtitle: 'Dept. Seminar Room', location: '공학관 3층 305호', maxParticipants: 20 },
  'project-room': { subtitle: 'Project Room', location: '공학관 5층 502호', maxParticipants: 8 },
  'futsal-a': { subtitle: 'Futsal Court A', location: '체육관 옥외 구장', maxParticipants: 10 },
  'futsal-b': { subtitle: 'Futsal Court B', location: '체육관 실내 구장', maxParticipants: 10 },
};

function parseCapacityFromAmenities(facility) {
  const capacityText = facility.amenities?.find((item) => item.text.includes('수용 인원'))?.text;
  const match = capacityText?.match(/(\d+)/);
  return match ? Number(match[1]) : 10;
}

export function getFacilityBookingMeta(facility) {
  if (facility?.maxParticipants != null || facility?.location) {
    return {
      subtitle: '',
      location: facility.location ?? '',
      maxParticipants: facility.maxParticipants ?? parseCapacityFromAmenities(facility),
      timeSlots: facility.timeSlots ?? DEFAULT_TIME_SLOTS,
    };
  }

  const meta = FACILITY_BOOKING_META[facility.id] ?? {};
  return {
    subtitle: meta.subtitle ?? '',
    location: meta.location ?? '',
    maxParticipants: meta.maxParticipants ?? parseCapacityFromAmenities(facility),
    timeSlots: meta.timeSlots ?? DEFAULT_TIME_SLOTS,
  };
}

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMinBookingDate(fromDate = new Date()) {
  const minDate = new Date(fromDate);
  minDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() + BOOKING_LEAD_DAYS);
  return toDateInputValue(minDate);
}

export function isBookableDate(dateStr, fromDate = new Date()) {
  if (!dateStr) return false;
  return dateStr >= getMinBookingDate(fromDate);
}

export function getBookedTimeSlots(existingReservations, facilityId, date) {
  if (!date) return [];

  return existingReservations
    .filter(
      (reservation) =>
        reservation.facilityId === facilityId &&
        reservation.date === date &&
        (reservation.status === RESERVATION_STATUS.APPROVED ||
          reservation.status === RESERVATION_STATUS.PENDING),
    )
    .flatMap((reservation) => reservation.timeSlots ?? []);
}

export function getTimeSlotsWithAvailability(timeSlots, bookedSlots) {
  const bookedSet = new Set(bookedSlots);

  return timeSlots.map((slot) => ({
    ...slot,
    disabled: Boolean(slot.disabled) || bookedSet.has(slot.value),
  }));
}

export function isFacilityEnterable(facility) {
  return Boolean(facility.available);
}

export function loadStoredReservations() {
  try {
    const raw = localStorage.getItem(MY_RESERVATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** DB 연동 이전 localStorage 예약 캐시 제거 */
export function clearStoredReservations() {
  try {
    localStorage.removeItem(MY_RESERVATIONS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatReservationDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatTimeSlots(slots) {
  if (!slots?.length) return '-';
  if (slots.length === 1) return slots[0];
  return `${slots[0]} ~ ${slots[slots.length - 1]} (${slots.length}시간)`;
}
