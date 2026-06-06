// ================================================
// middlewares/sanitizeAuth.js
// 로그인 요청 body 전처리 (validate 전에 실행)
// ================================================

const { sanitizeStudentId, sanitizePassword } = require('../utils/sanitize');

function sanitizeAuthLogin(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: '요청 본문 형식이 올바르지 않습니다.' });
  }

  if (req.body.studentId !== undefined && req.body.studentId !== null) {
    const studentResult = sanitizeStudentId(req.body.studentId);
    if (!studentResult.ok) {
      return res.status(400).json({ message: studentResult.message });
    }
    req.body.studentId = studentResult.value;
  }

  if (req.body.password !== undefined && req.body.password !== null) {
    const passwordResult = sanitizePassword(req.body.password);
    if (!passwordResult.ok) {
      return res.status(400).json({ message: passwordResult.message });
    }
    req.body.password = passwordResult.value;
  }

  next();
}

module.exports = { sanitizeAuthLogin };
