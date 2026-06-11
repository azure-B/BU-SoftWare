/** 관리자 로그인 학번 (시드: npm run seed:admin) */
const ADMIN_STUDENT_ID = process.env.ADMIN_STUDENT_ID || 'admin';

function isAdminStudentId(studentId) {
  return String(studentId ?? '').trim() === ADMIN_STUDENT_ID;
}

module.exports = {
  ADMIN_STUDENT_ID,
  isAdminStudentId,
};
