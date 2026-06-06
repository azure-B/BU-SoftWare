const {
  DEPARTMENT_OFFICES,
  formatDepartmentAnswer,
} = require('../data/departmentOffices');
const {
  COMMUTER_ROUTES,
  formatCampusShuttleAnswer,
  formatCommuterOverview,
  formatRouteAnswer,
} = require('../data/shuttleFaqData');
const {
  RENTAL_GENERAL_KEYWORDS,
  formatGeneralClassroomAnswer,
  buildClassroomEntries,
} = require('../data/classroomRentalFaq');

const OFFICE_HINT_KEYWORDS = ['사무실', '학과사무실', '과사무실', '위치', '연락처', '전화', '어디'];

const SHUTTLE_GENERAL_KEYWORDS = [
  '셔틀',
  '셔틀버스',
  '통학버스',
  '통학 버스',
  '버스',
  '통학',
];

const CAMPUS_SHUTTLE_KEYWORDS = [
  '캠퍼스셔틀',
  '캠퍼스 셔틀',
  '캠퍼스버스',
  '두정역',
  '천안역',
  '천안터미널',
];

const DEFAULT_ANSWER = [
  '학과 사무실, 강의실 대여, 셔틀·통학버스 정보를 안내해 드립니다.',
  '예: "컴퓨터공학부 사무실", "컴퓨터공학부 강의실", "강의실 대여", "교대 통학버스"',
].join('\n');

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[~·\-]/g, '');
}

function buildDepartmentEntries() {
  return DEPARTMENT_OFFICES.map((dept) => ({
    id: `dept-${dept.id}`,
    category: 'department',
    keywords: [...dept.keywords, ...OFFICE_HINT_KEYWORDS.map((hint) => `${dept.name}${hint}`)],
    answer: formatDepartmentAnswer(dept),
  }));
}

function buildShuttleEntries() {
  const campusEntry = {
    id: 'shuttle-campus',
    category: 'shuttle',
    keywords: CAMPUS_SHUTTLE_KEYWORDS,
    answer: formatCampusShuttleAnswer(),
  };

  const routeEntries = COMMUTER_ROUTES.map((route) => ({
    id: `shuttle-${route.id}`,
    category: 'shuttle',
    keywords: [...route.keywords, `${route.name}통학`, `${route.name}버스`, `${route.name}셔틀`],
    answer: formatRouteAnswer(route),
  }));

  return [campusEntry, ...routeEntries];
}

const FAQ_ENTRIES = [
  ...buildDepartmentEntries(),
  ...buildShuttleEntries(),
  ...buildClassroomEntries(),
];

function scoreEntry(entry, normalizedQuery) {
  let score = 0;

  entry.keywords.forEach((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) return;

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.length;
    }
  });

  return score;
}

function findAnswer(query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return { answer: DEFAULT_ANSWER, matched: null };
  }

  const specificEntries = FAQ_ENTRIES.filter((entry) => entry.id !== 'shuttle-overview');

  let bestEntry = null;
  let bestScore = 0;

  specificEntries.forEach((entry) => {
    const score = scoreEntry(entry, normalizedQuery);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  });

  if (bestEntry && bestScore > 0) {
    return {
      answer: bestEntry.answer,
      matched: bestEntry.id,
      category: bestEntry.category,
    };
  }

  const isGenericShuttleQuery = SHUTTLE_GENERAL_KEYWORDS.some((keyword) =>
    normalizedQuery.includes(normalize(keyword)),
  );

  if (isGenericShuttleQuery) {
    return {
      answer: formatCommuterOverview(),
      matched: 'shuttle-overview',
      category: 'shuttle',
    };
  }

  const isGenericClassroomQuery = RENTAL_GENERAL_KEYWORDS.some((keyword) =>
    normalizedQuery.includes(normalize(keyword)),
  );

  if (isGenericClassroomQuery) {
    return {
      answer: formatGeneralClassroomAnswer(),
      matched: 'classroom-overview',
      category: 'classroom',
    };
  }

  return { answer: DEFAULT_ANSWER, matched: null };
}

function getSuggestions() {
  return [
    '컴퓨터공학부 사무실',
    '교대 통학버스',
    '캠퍼스 셔틀',
    '아산 통학버스',
  ];
}

const FaqModel = {
  findAnswer,
  getSuggestions,
  FAQ_ENTRIES,
};

module.exports = FaqModel;
