const { validate, validateNumbers, validateEmail } = require('../src/middlewares/validate');

// 가짜 req / res / next 생성 헬퍼
function makeCtx(body = {}) {
  const req  = { body };
  const res  = {
    _status: null,
    _json:   null,
    status(code)  { this._status = code; return this; },
    json(data)    { this._json   = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

// ──────────────────────────────────────────────
describe('validate()', () => {
  it('필드가 모두 있으면 next()를 호출한다', () => {
    const { req, res, next } = makeCtx({ name: '홍길동', email: 'a@b.com' });
    validate('name', 'email')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('필드가 누락되면 400 + fields를 반환한다', () => {
    const { req, res, next } = makeCtx({ name: '홍길동' });
    validate('name', 'email')(req, res, next);
    expect(res._status).toBe(400);
    expect(res._json.fields).toContain('email');
    expect(next).not.toHaveBeenCalled();
  });

  it('빈 문자열도 누락으로 처리한다', () => {
    const { req, res, next } = makeCtx({ name: '  ' });
    validate('name')(req, res, next);
    expect(res._status).toBe(400);
  });
});

// ──────────────────────────────────────────────
describe('validateNumbers()', () => {
  it('숫자 문자열은 통과한다', () => {
    const { req, res, next } = makeCtx({ delta: '5' });
    validateNumbers('delta')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('숫자가 아니면 400을 반환한다', () => {
    const { req, res, next } = makeCtx({ delta: 'abc' });
    validateNumbers('delta')(req, res, next);
    expect(res._status).toBe(400);
    expect(res._json.fields).toContain('delta');
  });
});

// ──────────────────────────────────────────────
describe('validateEmail()', () => {
  it('올바른 이메일은 통과한다', () => {
    const { req, res, next } = makeCtx({ email: 'user@example.com' });
    validateEmail('email')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('잘못된 이메일 형식은 400을 반환한다', () => {
    const { req, res, next } = makeCtx({ email: 'not-an-email' });
    validateEmail('email')(req, res, next);
    expect(res._status).toBe(400);
  });

  it('이메일 필드가 없으면 통과한다 (validate가 따로 검사)', () => {
    const { req, res, next } = makeCtx({});
    validateEmail('email')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
