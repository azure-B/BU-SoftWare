/** 강의실 대여 FAQ (front departmentClassrooms.js 와 동일 기준) */

const DEPARTMENT_CLASSROOMS = [
  {
    id: 'christian',
    name: '기독교학부',
    keywords: ['기독교학부', '기독교'],
    rooms: ['목양관 101호', '목양관 102호', '목양관 103호'],
  },
  {
    id: 'police',
    name: '경찰학부',
    keywords: ['경찰학부', '경찰'],
    rooms: ['본부동 711호', '본부동 713호', '본부동 715호', '본부동 717호'],
  },
  {
    id: 'business',
    name: '경상학부',
    keywords: ['경상학부', '경상'],
    rooms: ['지혜관 601호', '지혜관 603호', '지혜관 609호'],
  },
  {
    id: 'tourism',
    name: '관광학부',
    keywords: ['관광학부', '관광'],
    rooms: ['본부동 405호', '본부동 407호', '본부동 411호'],
  },
  {
    id: 'nursing',
    name: '간호학과',
    keywords: ['간호학과', '간호'],
    rooms: ['조형관 610호', '조형관 612호', '조형관 618호'],
  },
  {
    id: 'design',
    name: '디자인영상학부',
    keywords: ['디자인영상학부', '디자인영상', '디자인', '영상'],
    rooms: ['조형관 301호', '조형관 305호', '조형관 309호', '조형관 311호'],
  },
  {
    id: 'arts',
    name: '문화예술학부',
    keywords: ['문화예술학부', '문화예술', '예술'],
    rooms: ['예술대학동 101호', '예술대학동 103호', '예술대학동 105호'],
  },
  {
    id: 'health',
    name: '보건학부',
    keywords: ['보건학부', '보건'],
    rooms: ['조형관 614호', '조형관 616호', '조형관 618호'],
  },
  {
    id: 'social-welfare',
    name: '사회복지학부',
    keywords: ['사회복지학부', '사회복지', '복지'],
    rooms: ['진리관 298호', '진리관 300호', '진리관 302호'],
  },
  {
    id: 'education',
    name: '사범학부',
    keywords: ['사범학부', '사범'],
    rooms: ['본부동 597호', '본부동 599호', '본부동 601호'],
  },
  {
    id: 'sports',
    name: '스포츠과학부',
    keywords: ['스포츠과학부', '스포츠'],
    rooms: ['체육관 298호', '체육관 300호', '체육관 302호'],
  },
  {
    id: 'language',
    name: '어문학부',
    keywords: ['어문학부', '어문'],
    rooms: ['본부동 407호', '본부동 409호', '본부동 411호'],
  },
  {
    id: 'advanced-it',
    name: '첨단 IT학부',
    keywords: ['첨단IT학부', '첨단 IT학부', '첨단IT', '첨단 IT', 'IT학부'],
    rooms: ['본부동 712호', '본부동 714호', '본부동 716호'],
  },
  {
    id: 'computer',
    name: '컴퓨터공학부',
    keywords: ['컴퓨터공학부', '컴퓨터공학', '컴공', '컴퓨터'],
    rooms: ['본부동 710호', '본부동 712호', '본부동 714호', '본부동 716호'],
  },
  {
    id: 'innovation',
    name: '혁신융합학부',
    keywords: ['혁신융합학부', '혁신융합', '혁신교육플랫폼대학', '혁신교육'],
    rooms: ['본부동 713호', '본부동 714호', '본부동 715호'],
  },
];

const RENTAL_HINT_KEYWORDS = ['강의실', '교실', '대여', '예약', '빌리', '사용'];

const RENTAL_GENERAL_KEYWORDS = [
  '강의실',
  '강의실대여',
  '강의실예약',
  '강의실 대여',
  '강의실 예약',
  '교실',
  '교실대여',
  '시설예약',
  '강의실빌려',
];

const BOOKING_GUIDE = [
  '예약: 학생 허브 [시설예약] > [소속 학과] 탭',
  '이용일 7일 전부터 예약 신청 가능',
  '승인 후 해당 강의실 이용',
].join('\n');

function formatDeptClassroomAnswer(dept) {
  const roomLines = dept.rooms.map((room) => `· ${room}`).join('\n');
  return [`【${dept.name} 강의실】`, roomLines, '', BOOKING_GUIDE].join('\n');
}

function formatGeneralClassroomAnswer() {
  const deptList = DEPARTMENT_CLASSROOMS.map((dept) => dept.name).join(', ');
  return [
    '【강의실 대여 안내】',
    '학생 허브 [시설예약] > [소속 학과]에서 학과별 강의실을 예약할 수 있습니다.',
    BOOKING_GUIDE,
    '',
    `예약 가능 학과: ${deptList}`,
    '학과명(예: 컴퓨터공학부 강의실)을 포함해 질문하면 상세 목록을 안내합니다.',
  ].join('\n');
}

function buildClassroomKeywords(dept) {
  const keywords = [...dept.keywords];

  dept.keywords.forEach((keyword) => {
    RENTAL_HINT_KEYWORDS.forEach((hint) => {
      keywords.push(`${keyword}${hint}`);
    });
  });

  RENTAL_HINT_KEYWORDS.forEach((hint) => {
    keywords.push(`${dept.name}${hint}`);
  });

  return keywords;
}

function buildClassroomEntries() {
  return DEPARTMENT_CLASSROOMS.map((dept) => ({
    id: `classroom-${dept.id}`,
    category: 'classroom',
    keywords: buildClassroomKeywords(dept),
    answer: formatDeptClassroomAnswer(dept),
  }));
}

module.exports = {
  DEPARTMENT_CLASSROOMS,
  RENTAL_GENERAL_KEYWORDS,
  formatGeneralClassroomAnswer,
  buildClassroomEntries,
};
