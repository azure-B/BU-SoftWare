/** Dashboard · 졸업요건 표시용 기본값 (신규 가입 시 시드) */
const GRADUATION_TOTALS = {
  major: 66,
  liberal: 40,
  elective: 34,
  overall: 140,
};

const DEFAULT_PROGRESS = {
  majorRequiredCredits: 54,
  liberalRequiredCredits: 32,
  electiveCredits: 9,
  gpa: 4.25,
  gpaMax: 4.5,
};

const CURRENT_SEMESTER = '2026-1';

const GRADE_POINTS = {
  'A+': 4.5,
  A0: 4.0,
  A: 4.0,
  'B+': 3.5,
  B0: 3.0,
  B: 3.0,
  'C+': 2.5,
  C0: 2.0,
  C: 2.0,
  'D+': 1.5,
  D0: 1.0,
  D: 1.0,
  F: 0,
};

const DEFAULT_ENROLLMENT_COURSES = [
  { name: '소프트웨어공학', grade: 'A0', type: 'major_required', credit: 3 },
  { name: '인공지능기초', grade: 'A+', type: 'major_required', credit: 3 },
  { name: '데이터베이스', grade: 'B+', type: 'major_required', credit: 3 },
  { name: '자료구조', grade: 'A0', type: 'major_required', credit: 3 },
  { name: '알고리즘', grade: 'B0', type: 'major_required', credit: 3 },
  { name: '글로벌역량 I', grade: 'B+', type: 'liberal_required', credit: 3 },
];

const DEFAULT_PAST_ENROLLMENT_COURSES = [
  { name: '운영체제', grade: 'A0', type: 'major_required', credit: 3 },
  { name: '컴퓨터네트워크', grade: 'A+', type: 'major_required', credit: 3 },
  { name: '채플과섬김 I', grade: 'P', type: 'liberal_required', credit: 1 },
  { name: '사랑의실천 I', grade: 'A0', type: 'liberal_required', credit: 2 },
  { name: '정보통신개론', grade: 'B+', type: 'liberal_required', credit: 2 },
  { name: '맞춤형글쓰기 I', grade: 'A0', type: 'liberal_required', credit: 2 },
];

const DEFAULT_ENROLLMENT_SEMESTERS = [
  { semester: CURRENT_SEMESTER, courses: DEFAULT_ENROLLMENT_COURSES },
  { semester: '2025-2', courses: DEFAULT_PAST_ENROLLMENT_COURSES },
];

const CREDIT_ROW_META = [
  { key: 'major', label: '전공 필수/선택', barClass: 'bg-primary-container' },
  { key: 'liberal', label: '교양 필수/선택', barClass: 'bg-secondary' },
  { key: 'elective', label: '일반 선택', barClass: 'bg-tertiary-container' },
];

function buildCreditRows(progress) {
  const currentByKey = {
    major: progress.majorRequiredCredits,
    liberal: progress.liberalRequiredCredits,
    elective: progress.electiveCredits,
  };

  return CREDIT_ROW_META.map((row) => {
    const current = currentByKey[row.key] ?? 0;
    const total = GRADUATION_TOTALS[row.key];
    const width = total > 0 ? `${Math.min(100, Math.round((current / total) * 100))}%` : '0%';

    return {
      label: row.label,
      current,
      total,
      width,
      barClass: row.barClass,
    };
  });
}

function buildDashboardSummary(progress, currentCourses) {
  const totalCredits =
    progress.majorRequiredCredits + progress.liberalRequiredCredits + progress.electiveCredits;

  return {
    gpa: progress.gpa,
    gpaMax: progress.gpaMax,
    totalCredits,
    totalRequired: GRADUATION_TOTALS.overall,
    creditRows: buildCreditRows(progress),
    currentCourses,
  };
}

function courseDisplayMeta(course) {
  const creditLabel = `${course.credit}학점`;

  if (course.type === 'major_required') {
    return { tag: `전공필수 • ${creditLabel}`, tagClass: 'text-secondary' };
  }
  if (course.type === 'liberal_required') {
    return { tag: `교양필수 • ${creditLabel}`, tagClass: 'text-tertiary-container' };
  }
  return { tag: `일반선택 • ${creditLabel}`, tagClass: 'text-outline' };
}

function computeGpaFromGrades(grades) {
  const points = grades
    .map((grade) => GRADE_POINTS[String(grade ?? '').trim()] ?? null)
    .filter((value) => value !== null);

  if (points.length === 0) return null;

  const average = points.reduce((sum, value) => sum + value, 0) / points.length;
  return Math.round(average * 100) / 100;
}

module.exports = {
  GRADUATION_TOTALS,
  DEFAULT_PROGRESS,
  CURRENT_SEMESTER,
  DEFAULT_ENROLLMENT_COURSES,
  DEFAULT_PAST_ENROLLMENT_COURSES,
  DEFAULT_ENROLLMENT_SEMESTERS,
  GRADE_POINTS,
  buildCreditRows,
  buildDashboardSummary,
  courseDisplayMeta,
  computeGpaFromGrades,
};
