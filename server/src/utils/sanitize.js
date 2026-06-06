// ================================================
// utils/sanitize.js
// 사용자 입력 정규화·검증 (SQL Injection / XSS 1차 방어)
// ================================================

const NULL_BYTE = /\0/g;

/** 문자열에서 null byte 제거 */
function stripNullBytes(value) {
  if (typeof value !== 'string') return value;
  return value.replace(NULL_BYTE, '');
}

/** 반드시 문자열이어야 하는 필드 — 객체·배열 등 거부 */
function assertPlainString(value, fieldName) {
  if (typeof value !== 'string') {
    return { ok: false, message: `${fieldName}은(는) 문자열이어야 합니다.` };
  }
  return { ok: true, value: stripNullBytes(value) };
}

/** 학번: 영숫자·하이픈·언더스코어만, 1~50자 (DB varchar(50) 정합) */
const STUDENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

function sanitizeStudentId(raw) {
  const parsed = assertPlainString(raw, 'studentId');
  if (!parsed.ok) return parsed;

  const trimmed = parsed.value.trim();
  if (!STUDENT_ID_PATTERN.test(trimmed)) {
    return { ok: false, message: '학번 형식이 올바르지 않습니다.' };
  }
  return { ok: true, value: trimmed };
}

/** bcrypt DoS 방지 — 과도하게 긴 비밀번호 거부 */
const PASSWORD_MAX_LENGTH = 128;

function sanitizePassword(raw) {
  const parsed = assertPlainString(raw, 'password');
  if (!parsed.ok) return parsed;

  const value = parsed.value.trim();
  if (value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: '비밀번호가 너무 깁니다.' };
  }
  if (value.length === 0) {
    return { ok: false, message: 'password', empty: true };
  }
  return { ok: true, value };
}

module.exports = {
  stripNullBytes,
  assertPlainString,
  sanitizeStudentId,
  sanitizePassword,
  STUDENT_ID_PATTERN,
  PASSWORD_MAX_LENGTH,
};
