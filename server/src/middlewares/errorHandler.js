// ================================================
// middlewares/errorHandler.js
// 404 / 전역 에러 처리
// ================================================

function notFound(req, res, next) {
  const err  = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status  = err.status || 500;
  const isDev   = process.env.NODE_ENV === 'development';

  res.status(status).json({
    message: err.message || 'Internal Server Error',
    // 개발 환경에서만 스택 트레이스 노출
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
