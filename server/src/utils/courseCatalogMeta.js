const MAJOR_TRACK_BY_NAME = {
  프로그래밍기초: 'basic',
  컴퓨터공학개론: 'basic',
  자료구조: 'core',
  알고리즘: 'core',
  운영체제: 'core',
  데이터베이스: 'depth',
  컴퓨터네트워크: 'depth',
  컴파일러설계: 'depth',
  소프트웨어공학: 'applied',
  인공지능기초: 'applied',
};

const LIBERAL_META_BY_NAME = {
  '채플과섬김 I': { ge_area: '백석', ge_subject: '채플과섬김' },
  '채플과섬김 II': { ge_area: '백석', ge_subject: '채플과섬김' },
  '사랑의실천 I': { ge_area: '백석', ge_subject: '사랑의실천' },
  '사랑의실천 II': { ge_area: '백석', ge_subject: '사랑의실천' },
  '글로벌역량 I': { ge_area: '기초', ge_subject: '글로벌역량' },
  '글로벌역량 II': { ge_area: '기초', ge_subject: '글로벌역량' },
  정보통신개론: { ge_area: '기초', ge_subject: '정보통신' },
  디지털리터러시: { ge_area: '기초', ge_subject: '정보통신' },
  '맞춤형글쓰기 I': { ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  '맞춤형글쓰기 II': { ge_area: '기초', ge_subject: '맞춤형글쓰기' },
  '과학과 토론 I': { ge_area: '기초', ge_subject: '과학과 토론' },
  '과학과 토론 II': { ge_area: '기초', ge_subject: '과학과 토론' },
  '균형-인간문화이해 I': { ge_area: '심화', ge_subject: '균형-인간문화이해' },
  '균형-인간문화이해 II': { ge_area: '심화', ge_subject: '균형-인간문화이해' },
  '균형-사회역사이해': { ge_area: '심화', ge_subject: '균형-사회역사이해' },
  '균형-자연과학기술이해': { ge_area: '심화', ge_subject: '균형-자연과학기술이해' },
  '균형-예술체육이해 I': { ge_area: '심화', ge_subject: '균형-예술체육이해' },
  '균형-예술체육이해 II': { ge_area: '심화', ge_subject: '균형-예술체육이해' },
  '사고와 문제해결 I': { ge_area: '심화', ge_subject: '사고와 문제해결' },
  '사고와 문제해결 II': { ge_area: '심화', ge_subject: '사고와 문제해결' },
};

function enrichCourse(course) {
  if (!course?.name) return course;

  if (course.ge_area != null || course.ge_subject != null || course.major_track != null) {
    return course;
  }

  if (course.type === 'major_required' && MAJOR_TRACK_BY_NAME[course.name]) {
    return {
      ...course,
      major_track: MAJOR_TRACK_BY_NAME[course.name],
      ge_area: null,
      ge_subject: null,
    };
  }

  if (course.type === 'liberal_required' && LIBERAL_META_BY_NAME[course.name]) {
    return {
      ...course,
      major_track: null,
      ...LIBERAL_META_BY_NAME[course.name],
    };
  }

  return {
    ...course,
    major_track: course.major_track ?? null,
    ge_area: course.ge_area ?? null,
    ge_subject: course.ge_subject ?? null,
  };
}

function enrichEnrollmentRow(row) {
  if (!row) return row;
  return {
    ...row,
    courses: enrichCourse(row.courses),
  };
}

module.exports = {
  MAJOR_TRACK_BY_NAME,
  LIBERAL_META_BY_NAME,
  enrichCourse,
  enrichEnrollmentRow,
};
