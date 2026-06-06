const { GRADUATION_TOTALS, DEFAULT_PROGRESS, GRADE_POINTS } = require('./defaultAcademicProfile');

const MIN_GPA_REQUIRED = 1.5;

const MAJOR_TRACK_LABELS = {
  basic: '기초',
  core: '핵심',
  depth: '심화',
  applied: '응용',
};

const BALANCE_GE_SUBJECTS = [
  '균형-인간문화이해',
  '균형-사회역사이해',
  '균형-자연과학기술이해',
  '균형-예술체육이해',
];

/** @type {Array<object>} GeRequirementsTable 행 정의 (이수 기준) */
const GE_TABLE_REQUIREMENTS = [
  {
    no: 1,
    areaRowSpan: 2,
    area: '백석',
    subject: '채플과섬김',
    matchSubjects: ['채플과섬김'],
    minSubjects: 8,
    minCredits: 4,
  },
  {
    no: 2,
    subject: '사랑의실천',
    matchSubjects: ['사랑의실천'],
    minSubjects: 0,
    minCredits: 4,
  },
  {
    no: 3,
    areaRowSpan: 4,
    area: '기초',
    subject: '글로벌역량',
    matchSubjects: ['글로벌역량'],
    minSubjects: 0,
    minCredits: 6,
  },
  {
    no: 4,
    subject: '정보통신',
    matchSubjects: ['정보통신'],
    minSubjects: 0,
    minCredits: 2,
  },
  {
    no: 5,
    subject: '맞춤형글쓰기',
    matchSubjects: ['맞춤형글쓰기'],
    minSubjects: 0,
    minCredits: 2,
    rowClass: 'bg-surface-container-low',
  },
  {
    no: 6,
    subject: '과학과 토론',
    matchSubjects: ['과학과 토론'],
    minSubjects: 0,
    minCredits: 2,
  },
  {
    no: 7,
    areaRowSpan: 2,
    area: '심화',
    subjectLines: BALANCE_GE_SUBJECTS,
    matchSubjects: BALANCE_GE_SUBJECTS,
    minSubjects: 0,
    minCredits: 6,
  },
  {
    no: 8,
    subject: '사고와 문제해결',
    matchSubjects: ['사고와 문제해결'],
    minSubjects: 0,
    minCredits: 2,
  },
];

function isPassingGrade(grade) {
  if (grade == null || grade === '') return false;
  return String(grade).trim().toUpperCase() !== 'F';
}

function matchesGeSubject(courseSubject, matchers) {
  if (!courseSubject) return false;
  return matchers.some((key) => courseSubject === key || courseSubject.startsWith(`${key}`));
}

function aggregateGeEarned(enrollments, matchers) {
  const matched = enrollments.filter((row) => {
    const subject = row.courses?.ge_subject;
    return row.courses?.type === 'liberal_required' && matchesGeSubject(subject, matchers);
  });

  return {
    earnedSubjects: matched.length,
    earnedCredits: matched.reduce((sum, row) => sum + (row.courses?.credit ?? 0), 0),
  };
}

function buildGeTableRows(enrollments) {
  const passed = enrollments.filter((row) => isPassingGrade(row.grade));

  return GE_TABLE_REQUIREMENTS.map((req) => {
    const { earnedSubjects, earnedCredits } = aggregateGeEarned(passed, req.matchSubjects);
    const shortSubjects = Math.max(0, req.minSubjects - earnedSubjects);
    const shortCredits = Math.max(0, req.minCredits - earnedCredits);
    const shortHighlight = shortSubjects > 0 || shortCredits > 0;

    return {
      no: req.no,
      area: req.area,
      areaRowSpan: req.areaRowSpan,
      subject: req.subject,
      subjectLines: req.subjectLines,
      minSubjects: req.minSubjects,
      minCredits: req.minCredits,
      earnedSubjects,
      earnedCredits,
      earnedCreditsBold: earnedCredits > req.minCredits,
      shortSubjects,
      shortCredits,
      shortHighlight,
      rowClass: req.rowClass,
    };
  });
}

function buildMajorBlocks(enrollments) {
  const passedMajor = enrollments.filter(
    (row) => row.courses?.type === 'major_required' && isPassingGrade(row.grade),
  );

  const creditsByTrack = { basic: 0, core: 0, depth: 0, applied: 0 };
  for (const row of passedMajor) {
    const track = row.courses?.major_track;
    if (track && track in creditsByTrack) {
      creditsByTrack[track] += row.courses?.credit ?? 0;
    }
  }

  return Object.entries(MAJOR_TRACK_LABELS).map(([track, label]) => ({
    label,
    credits: creditsByTrack[track] ?? 0,
  }));
}

const COURSE_TYPE_LABELS = {
  major_required: '전공필수',
  liberal_required: '교양필수',
  elective: '일반선택',
};

function formatSemesterLabel(semester) {
  if (!semester) return '학기 미지정';
  const parts = String(semester).split('-');
  if (parts.length < 2) return semester;
  const [year, term] = parts;
  const termLabel = term === '1' ? '1학기' : term === '2' ? '2학기' : `${term}학기`;
  return `${year}학년도 ${termLabel}`;
}

function gradeDisplay(grade) {
  if (grade == null || grade === '') return '수강중';
  return String(grade);
}

function computeSemesterGpa(courses) {
  const points = courses
    .map((course) => GRADE_POINTS[String(course.grade ?? '').trim()] ?? null)
    .filter((value) => value !== null);

  if (points.length === 0) return null;

  const average = points.reduce((sum, value) => sum + value, 0) / points.length;
  return Math.round(average * 100) / 100;
}

function buildSemesterGrades(enrollments) {
  const bySemester = new Map();

  for (const row of enrollments) {
    const semester = row.semester ?? 'unknown';
    if (!bySemester.has(semester)) bySemester.set(semester, []);

    bySemester.get(semester).push({
      name: row.courses?.name ?? '',
      typeLabel: COURSE_TYPE_LABELS[row.courses?.type] ?? row.courses?.type ?? '—',
      credit: row.courses?.credit ?? 0,
      grade: gradeDisplay(row.grade),
    });
  }

  return [...bySemester.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([semester, courses]) => ({
      semester,
      semesterLabel: formatSemesterLabel(semester),
      courses,
      totalCredits: courses.reduce((sum, course) => sum + course.credit, 0),
      semesterGpa: computeSemesterGpa(courses),
    }));
}

function buildMyPageProfile(progress) {
  const totalCredits =
    progress.majorRequiredCredits + progress.liberalRequiredCredits + progress.electiveCredits;

  return {
    totalCredits,
    totalRequired: GRADUATION_TOTALS.overall,
    gpa: progress.gpa,
    gpaMax: progress.gpaMax ?? DEFAULT_PROGRESS.gpaMax,
    minGpaRequired: MIN_GPA_REQUIRED,
    majorCredits: progress.majorRequiredCredits,
    majorRequired: GRADUATION_TOTALS.major,
    liberalCredits: progress.liberalRequiredCredits,
    liberalRequired: GRADUATION_TOTALS.liberal,
  };
}

module.exports = {
  MIN_GPA_REQUIRED,
  MAJOR_TRACK_LABELS,
  GE_TABLE_REQUIREMENTS,
  isPassingGrade,
  buildGeTableRows,
  buildMajorBlocks,
  buildSemesterGrades,
  buildMyPageProfile,
  formatSemesterLabel,
};
