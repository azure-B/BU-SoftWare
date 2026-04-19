// ================================================
// middlewares/logger.js
// 요청마다 메서드, 경로, 상태코드, 응답시간 출력
// ================================================

const COLORS = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

function colorStatus(code) {
  if (code < 300) return COLORS.green;
  if (code < 400) return COLORS.cyan;
  if (code < 500) return COLORS.yellow;
  return COLORS.red;
}

function logger(req, res, next) {
  const start = Date.now();

  // 응답이 끝날 때 로그 출력
  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const color   = colorStatus(status);
    const method  = req.method.padEnd(7);
    const path    = req.originalUrl;
    const time    = new Date().toLocaleTimeString('ko-KR');

    console.log(
      `${COLORS.gray}[${time}]${COLORS.reset} ` +
      `${COLORS.cyan}${method}${COLORS.reset} ` +
      `${path.padEnd(30)} ` +
      `${color}${status}${COLORS.reset} ` +
      `${COLORS.gray}${ms}ms${COLORS.reset}`
    );
  });

  next();
}

module.exports = logger;
