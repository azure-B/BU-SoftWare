const AdminModel = require('../models/adminModel');

async function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const isAdmin = await AdminModel.isUserAdmin(req.user.id, req.user.studentId);
    if (!isAdmin) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = requireAdmin;
