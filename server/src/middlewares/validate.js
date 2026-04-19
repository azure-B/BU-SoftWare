// ================================================
// middlewares/validate.js
// 요청 body 필드 유효성 검사 미들웨어 팩토리
// ================================================

/**
 * 필수 필드 검사
 * @param  {...string} fields - 필수 필드명
 *
 * 사용 예:
 *   router.post('/', validate('name', 'email'), controller.create)
 */
function validate(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || String(val).trim() === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        message: `필수 필드가 누락되었습니다: ${missing.join(', ')}`,
        fields:  missing,
      });
    }

    next();
  };
}

/**
 * 숫자 필드 검사
 * @param  {...string} fields - 숫자여야 하는 필드명
 */
function validateNumbers(...fields) {
  return (req, res, next) => {
    const invalid = fields.filter(f => isNaN(Number(req.body[f])));

    if (invalid.length > 0) {
      return res.status(400).json({
        message: `숫자 형식이 아닌 필드: ${invalid.join(', ')}`,
        fields:  invalid,
      });
    }

    next();
  };
}

/**
 * 이메일 형식 검사
 * @param {string} field - 이메일 필드명 (기본: 'email')
 */
function validateEmail(field = 'email') {
  return (req, res, next) => {
    const val   = req.body[field];
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (val && !regex.test(val)) {
      return res.status(400).json({
        message: `올바른 이메일 형식이 아닙니다: ${field}`,
      });
    }

    next();
  };
}

module.exports = { validate, validateNumbers, validateEmail };
