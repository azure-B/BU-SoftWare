const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    return next(err);
  }

  try {
    const payload = jwt.verify(header.slice(7), secret);
    req.user = {
      id: payload.userId,
      studentId: payload.studentId,
    };
    return next();
  } catch {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = requireAuth;
