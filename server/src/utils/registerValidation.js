const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|[\]\\/_+\-=~`';<>]/;

const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  specialRequired: true,
};

const EMAIL_DOMAIN = '@bu.ac.kr';
const EMAIL_LOCAL_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

/** 회원가입 선택지에서 제외 (기존 사용자 FK 유지용 레거시명) */
const REGISTRATION_EXCLUDED_DEPARTMENT_NAMES = new Set(['컴퓨터공학과']);

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

function validateDepartmentId(departmentId) {
  const id = Number(departmentId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: '학과를 선택해 주세요.' };
  }
  return { ok: true, value: id };
}

function isDepartmentAvailableForRegistration(name) {
  return !REGISTRATION_EXCLUDED_DEPARTMENT_NAMES.has(name);
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
  REGISTRATION_EXCLUDED_DEPARTMENT_NAMES,
  validatePassword,
  buildCampusEmail,
  validateName,
  validateDepartmentId,
  isDepartmentAvailableForRegistration,
  validateVerificationCode,
  generateVerificationCode,
};
