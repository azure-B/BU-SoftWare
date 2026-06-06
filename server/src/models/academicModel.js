const { getServerClient } = require('../config/supabase');
const {
  DEFAULT_PROGRESS,
  CURRENT_SEMESTER,
  DEFAULT_ENROLLMENT_COURSES,
  DEFAULT_ENROLLMENT_SEMESTERS,
  buildDashboardSummary,
  courseDisplayMeta,
  computeGpaFromGrades,
} = require('../utils/defaultAcademicProfile');
const {
  buildGeTableRows,
  buildMajorBlocks,
  buildMyPageProfile,
  buildSemesterGrades,
} = require('../utils/mypageRequirements');
const { enrichEnrollmentRow } = require('../utils/courseCatalogMeta');

function mapCourseRow(row) {
  const meta = courseDisplayMeta({
    type: row.courses?.type ?? row.type,
    credit: row.courses?.credit ?? row.credit,
  });

  return {
    name: row.courses?.name ?? row.name,
    tag: meta.tag,
    tagClass: meta.tagClass,
  };
}

function buildProgressFromGraduation(graduation) {
  return {
    majorRequiredCredits: graduation.major_required_credits ?? 0,
    liberalRequiredCredits: graduation.liberal_required_credits ?? 0,
    electiveCredits: graduation.elective_credits ?? 0,
    gpa: graduation.gpa ?? DEFAULT_PROGRESS.gpa,
    gpaMax: DEFAULT_PROGRESS.gpaMax,
  };
}

const AcademicModel = {
  findGraduationCheck: async (userId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('graduation_check')
      .select('major_required_credits, liberal_required_credits, elective_credits, gpa')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.message?.includes('gpa')) {
        const fallback = await supabase
          .from('graduation_check')
          .select('major_required_credits, liberal_required_credits, elective_credits')
          .eq('user_id', userId)
          .maybeSingle();

        if (fallback.error) {
          const err = new Error('학점 요약을 불러오지 못했습니다.');
          err.status = 500;
          err.cause = fallback.error;
          throw err;
        }

        return fallback.data;
      }

      const err = new Error('학점 요약을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return data;
  },

  findEnrollmentGrades: async (userId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('grade')
      .eq('user_id', userId)
      .not('grade', 'is', null);

    if (error) {
      const err = new Error('성적 정보를 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map((row) => row.grade);
  },

  findCompletedEnrollments: async (userId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, grade, courses ( name, type, credit )')
      .eq('user_id', userId)
      .not('grade', 'is', null)
      .order('id', { ascending: true });

    if (error) {
      const err = new Error('이수 과목을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(enrichEnrollmentRow);
  },

  findTranscriptEnrollments: async (userId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, grade, semester, courses ( name, type, credit )')
      .eq('user_id', userId)
      .order('semester', { ascending: false })
      .order('id', { ascending: true });

    if (error) {
      const err = new Error('학기별 성적을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return (data ?? []).map(enrichEnrollmentRow);
  },

  findCurrentEnrollments: async (userId) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, semester, courses ( name, type, credit )')
      .eq('user_id', userId)
      .eq('semester', CURRENT_SEMESTER)
      .order('id', { ascending: true });

    if (error) {
      const err = new Error('수강 과목을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    return data ?? [];
  },

  findCoursesByNames: async (names) => {
    if (!names.length) return [];

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, type, credit')
      .in('name', names);

    if (error) {
      const err = new Error('과목 목록을 불러오지 못했습니다.');
      err.status = 500;
      err.cause = error;
      throw err;
    }

    const order = new Map(names.map((name, index) => [name, index]));
    return [...(data ?? [])].sort(
      (a, b) => (order.get(a.name) ?? 999) - (order.get(b.name) ?? 999),
    );
  },

  resolveProgress: async (userId, graduation) => {
    const progress = graduation ? buildProgressFromGraduation(graduation) : { ...DEFAULT_PROGRESS };
    const grades = await AcademicModel.findEnrollmentGrades(userId);
    const computedGpa = computeGpaFromGrades(grades);

    if (computedGpa !== null) {
      progress.gpa = computedGpa;
    }

    return progress;
  },

  createDefaultProfile: async (userId) => {
    const supabase = getServerClient();

    const { data: existing } = await supabase
      .from('graduation_check')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      const insertPayload = {
        user_id: userId,
        major_required_credits: DEFAULT_PROGRESS.majorRequiredCredits,
        liberal_required_credits: DEFAULT_PROGRESS.liberalRequiredCredits,
        elective_credits: DEFAULT_PROGRESS.electiveCredits,
        gpa: DEFAULT_PROGRESS.gpa,
      };

      let { error: graduationError } = await supabase.from('graduation_check').insert(insertPayload);

      if (graduationError?.message?.includes('gpa')) {
        ({ error: graduationError } = await supabase.from('graduation_check').insert({
          user_id: userId,
          major_required_credits: DEFAULT_PROGRESS.majorRequiredCredits,
          liberal_required_credits: DEFAULT_PROGRESS.liberalRequiredCredits,
          elective_credits: DEFAULT_PROGRESS.electiveCredits,
        }));
      }

      if (graduationError) {
        const err = new Error('기본 학점 프로필 생성에 실패했습니다.');
        err.status = 500;
        err.cause = graduationError;
        throw err;
      }
    }

    let enrollmentsSeeded = 0;

    for (const semesterEntry of DEFAULT_ENROLLMENT_SEMESTERS) {
      const courseNames = semesterEntry.courses.map((course) => course.name);
      const courses = await AcademicModel.findCoursesByNames(courseNames);
      if (courses.length === 0) continue;

      const gradeByName = new Map(
        semesterEntry.courses.map((course) => [course.name, course.grade]),
      );

      const { data: existingEnrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .eq('semester', semesterEntry.semester);

      const enrolledIds = new Set((existingEnrollments ?? []).map((row) => row.course_id));
      const toInsert = courses
        .filter((course) => !enrolledIds.has(course.id))
        .map((course) => ({
          user_id: userId,
          course_id: course.id,
          semester: semesterEntry.semester,
          grade: gradeByName.get(course.name) ?? null,
        }));

      if (toInsert.length === 0) continue;

      const { error: enrollmentError } = await supabase.from('enrollments').insert(toInsert);

      if (enrollmentError) {
        const err = new Error('기본 수강 과목 생성에 실패했습니다.');
        err.status = 500;
        err.cause = enrollmentError;
        throw err;
      }

      enrollmentsSeeded += toInsert.length;
    }

    return { graduationSeeded: !existing, enrollmentsSeeded };
  },

  getDashboardSummary: async (userId) => {
    let graduation = await AcademicModel.findGraduationCheck(userId);

    if (!graduation) {
      await AcademicModel.createDefaultProfile(userId);
      graduation = await AcademicModel.findGraduationCheck(userId);
    }

    const progress = await AcademicModel.resolveProgress(userId, graduation);

    const enrollments = await AcademicModel.findCurrentEnrollments(userId);
    let currentCourses = enrollments.map(mapCourseRow).filter((course) => course.name);

    if (currentCourses.length === 0) {
      await AcademicModel.createDefaultProfile(userId);
      const refreshed = await AcademicModel.findCurrentEnrollments(userId);
      currentCourses = refreshed.map(mapCourseRow).filter((course) => course.name);
    }

    if (currentCourses.length === 0) {
      currentCourses = DEFAULT_ENROLLMENT_COURSES.map((course) => ({
        name: course.name,
        ...courseDisplayMeta(course),
      }));
    }

    return buildDashboardSummary(progress, currentCourses);
  },

  getMyPageProfile: async (userId) => {
    let graduation = await AcademicModel.findGraduationCheck(userId);

    if (!graduation) {
      await AcademicModel.createDefaultProfile(userId);
      graduation = await AcademicModel.findGraduationCheck(userId);
    }

    const progress = await AcademicModel.resolveProgress(userId, graduation);
    const completedEnrollments = await AcademicModel.findCompletedEnrollments(userId);
    const transcriptEnrollments = await AcademicModel.findTranscriptEnrollments(userId);

    return {
      ...buildMyPageProfile(progress),
      majorBlocks: buildMajorBlocks(completedEnrollments),
      geTableRows: buildGeTableRows(completedEnrollments),
      semesterGrades: buildSemesterGrades(transcriptEnrollments),
    };
  },
};

module.exports = AcademicModel;
