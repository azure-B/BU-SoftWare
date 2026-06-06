const jwt = require('jsonwebtoken');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const payload = jwt.verify(header.slice(7), secret);
    req.user = {
      id: payload.userId,
      studentId: payload.studentId,
    };
  } catch {
    // ignore invalid token — treat as anonymous
  }

  return next();
}

module.exports = optionalAuth;
