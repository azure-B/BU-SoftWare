const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|[\]\\/_+\-=~`';<>]/;

const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  specialRequired: true,
};

const EMAIL_DOMAIN = '@bu.ac.kr';
const EMAIL_LOCAL_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

const DEPARTMENT_SLUGS = {
  computer_science: '컴퓨터공학부',
  advanced_it: '첨단IT학부',
};

const NAME_PATTERN = /^[\p{L}\p{N}\s.-]{2,50}$/u;

function validatePassword(password) {
  if (typeof password !== 'string') {
    return { ok: false, message: '비밀번호 형식이 올바르지 않습니다.' };
  }

  const value = password.trim();
  if (value.length < PASSWORD_POLICY.minLength) {
    return { ok: false, message: '비밀번호는 8자 이상이어야 합니다.' };
  }
  if (value.length > PASSWORD_POLICY.maxLength) {
    return { ok: false, message: '비밀번호가 너무 깁니다.' };
  }
  if (PASSWORD_POLICY.specialRequired && !SPECIAL_CHAR_PATTERN.test(value)) {
    return { ok: false, message: '비밀번호에 특수문자를 1개 이상 포함해야 합니다.' };
  }
  return { ok: true, value };
}

function buildCampusEmail(emailLocal) {
  if (typeof emailLocal !== 'string') {
    return { ok: false, message: '이메일 형식이 올바르지 않습니다.' };
  }
  const local = emailLocal.trim().toLowerCase();
  if (!EMAIL_LOCAL_PATTERN.test(local)) {
    return { ok: false, message: '이메일 아이디 형식이 올바르지 않습니다.' };
  }
  return { ok: true, value: `${local}${EMAIL_DOMAIN}` };
}

function validateName(name) {
  if (typeof name !== 'string') {
    return { ok: false, message: '이름 형식이 올바르지 않습니다.' };
  }
  const value = name.trim();
  if (!NAME_PATTERN.test(value)) {
    return { ok: false, message: '이름은 2~50자로 입력해 주세요.' };
  }
  return { ok: true, value };
}

function validateDepartmentSlug(slug) {
  if (typeof slug !== 'string' || !DEPARTMENT_SLUGS[slug]) {
    return { ok: false, message: '학과를 선택해 주세요.' };
  }
  return { ok: true, value: slug, label: DEPARTMENT_SLUGS[slug] };
}

function validateVerificationCode(code) {
  if (typeof code !== 'string') {
    return { ok: false, message: '인증번호 형식이 올바르지 않습니다.' };
  }
  const value = code.trim();
  if (!/^\d{6}$/.test(value)) {
    return { ok: false, message: '인증번호는 6자리 숫자입니다.' };
  }
  return { ok: true, value };
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = {
  SPECIAL_CHAR_PATTERN,
  PASSWORD_POLICY,
  EMAIL_DOMAIN,
  DEPARTMENT_SLUGS,
  validatePassword,
  buildCampusEmail,
  validateName,
  validateDepartmentSlug,
  validateVerificationCode,
  generateVerificationCode,
};
