/** UI 카테고리 메타 (시설 데이터는 DB facilities 테이블) */
const FACILITY_CATEGORIES = [
  { id: 'startup', label: '창업지원단', icon: 'business_center', global: true },
  { id: 'student', label: '학생처', icon: 'school', global: true },
  { id: 'dept', label: '소속 학과', icon: 'account_balance', global: false },
  { id: 'futsal', label: '풋살장', icon: 'sports_soccer', global: true },
];

const CATEGORY_SECTION_TITLES = {
  startup: '창업지원단 공간',
  student: '학생처 시설',
  dept: '소속 학과 시설',
  futsal: '풋살장',
};

const GLOBAL_FACILITY_TEMPLATES = {
  startup: [
    {
      slug: 'startup-coworking',
      name: '코워킹 스페이스',
      location: '창업지원단 2층',
      description: '다양한 팀이 함께 아이디어를 나누고 작업할 수 있는 오픈 스페이스입니다.',
      max_participants: 20,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 20명' },
        { icon: 'wifi', text: '구비 시설: 초고속 와이파이, 화이트보드, 공용 복합기' },
      ],
    },
    {
      slug: 'startup-meeting-a',
      name: '회의실 A',
      location: '창업지원단 3층',
      description: '소규모 팀 회의 및 프레젠테이션 연습에 적합한 독립된 회의 공간입니다.',
      max_participants: 6,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 6명' },
        { icon: 'tv', text: '구비 시설: 대형 모니터, HDMI 케이블, 화이트보드' },
      ],
    },
    {
      slug: 'startup-seminar',
      name: '세미나실',
      location: '창업지원단 1층',
      description: '특강, 워크숍, 대규모 발표를 위한 세미나 공간입니다.',
      max_participants: 40,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 40명' },
        { icon: 'videocam', text: '구비 시설: 빔 프로젝터, 음향 장비, 단상' },
      ],
    },
  ],
  student: [
    {
      slug: 'student-counseling',
      name: '학생상담실',
      location: '학생회관 2층',
      description: '학업·진로·심리 상담을 위한 1:1 및 소그룹 상담 공간입니다.',
      max_participants: 4,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 4명' },
        { icon: 'lock', text: '구비 시설: 음향 차단, 상담 기록용 PC' },
      ],
    },
    {
      slug: 'student-club-room',
      name: '동아리 활동실',
      location: '학생회관 3층',
      description: '학생 동아리 정기 모임, 연습, 소규모 공연 리허설에 이용할 수 있는 공간입니다.',
      max_participants: 30,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 30명' },
        { icon: 'music_note', text: '구비 시설: 음향 장비, 거울 벽, 이동식 의자' },
      ],
    },
    {
      slug: 'student-lounge',
      name: '학생회관 다목적실',
      location: '학생회관 1층',
      description: '학생회 행사, OT, 설명회 등 대규모 학생 행사를 위한 다목적 공간입니다.',
      max_participants: 80,
      is_available: false,
      amenities: [
        { icon: 'groups', text: '수용 인원: 80명' },
        { icon: 'event', text: '구비 시설: 무대, 빔 프로젝터, 좌석 80석' },
      ],
    },
  ],
  futsal: [
    {
      slug: 'futsal-a',
      name: '풋살장 A구역',
      location: '체육관 옥외 구장',
      description: '인조 잔디 구장으로 동아리 연습 및 친선 경기에 이용할 수 있습니다.',
      max_participants: 10,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 10명 (5vs5)' },
        { icon: 'sports', text: '구비 시설: 조명, 골대, 벤치, 샤워실(인근)' },
      ],
    },
    {
      slug: 'futsal-b',
      name: '풋살장 B구역',
      location: '체육관 실내 구장',
      description: '실내 풋살장으로 날씨와 관계없이 이용 가능한 실내 구역입니다.',
      max_participants: 10,
      is_available: false,
      amenities: [
        { icon: 'groups', text: '수용 인원: 10명 (5vs5)' },
        { icon: 'ac_unit', text: '구비 시설: 에어컨, 실내 조명, 탈의실' },
      ],
    },
  ],
};

function buildDepartmentFacilityTemplates(department) {
  const deptName = department.name;
  return [
    {
      slug: `dept-${department.id}-lab`,
      name: `${deptName} 실습실`,
      location: `${deptName}관`,
      description: `${deptName} 전공 실습 및 팀 프로젝트를 위한 학과 전용 공간입니다.`,
      max_participants: 24,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 24명' },
        { icon: 'computer', text: '구비 시설: PC, Wi-Fi, 화이트보드' },
      ],
    },
    {
      slug: `dept-${department.id}-seminar`,
      name: `${deptName} 세미나실`,
      location: `${deptName}관`,
      description: `${deptName} 세미나, 발표, 교수·학생 회의를 위한 세미나 공간입니다.`,
      max_participants: 20,
      is_available: true,
      amenities: [
        { icon: 'groups', text: '수용 인원: 20명' },
        { icon: 'videocam', text: '구비 시설: 빔 프로젝터, 전자칠판, 마이크' },
      ],
    },
  ];
}

module.exports = {
  FACILITY_CATEGORIES,
  CATEGORY_SECTION_TITLES,
  GLOBAL_FACILITY_TEMPLATES,
  buildDepartmentFacilityTemplates,
};
