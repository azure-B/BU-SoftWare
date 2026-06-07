const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: message || '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    },
  });
}

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

const authLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.',
});

const otpSendLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: '인증번호 발송 횟수를 초과했습니다. 1시간 후 다시 시도해 주세요.',
});

const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: '인증번호 확인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
});

module.exports = {
  globalLimiter,
  authLoginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
};
