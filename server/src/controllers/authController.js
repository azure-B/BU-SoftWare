const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

function toPublicUser(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name,
    departmentId: row.department_id,
    departmentName: row.department_name,
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    throw err;
  }

  return jwt.sign(
    { userId: user.id, studentId: user.student_id },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

const authController = {
  // POST /api/auth/login
  login: async (req, res, next) => {
    try {
      const { studentId, password } = req.body;
      const user = await AuthModel.findByStudentId(studentId);

      if (!user) {
        return res.status(401).json({ message: '학번 또는 비밀번호가 올바르지 않습니다.' });
      }

      const valid = await AuthModel.verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: '학번 또는 비밀번호가 올바르지 않습니다.' });
      }

      const token = signToken(user);
      res.json({ token, user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
