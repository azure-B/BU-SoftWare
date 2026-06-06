const {
  sanitizeStudentId,
  sanitizePassword,
  stripNullBytes,
} = require('../src/utils/sanitize');

describe('sanitize utils', () => {
  describe('sanitizeStudentId', () => {
    it('유효한 학번을 trim하여 반환한다', () => {
      expect(sanitizeStudentId('  20240001  ')).toEqual({ ok: true, value: '20240001' });
    });

    it('SQL Injection 패턴을 거부한다', () => {
      const result = sanitizeStudentId("20240001' OR '1'='1");
      expect(result.ok).toBe(false);
    });

    it('객체 타입 입력을 거부한다', () => {
      expect(sanitizeStudentId({ $gt: '' }).ok).toBe(false);
    });
  });

  describe('sanitizePassword', () => {
    it('128자 이하 비밀번호를 허용한다', () => {
      expect(sanitizePassword('password123').ok).toBe(true);
    });

    it('129자 이상 비밀번호를 거부한다', () => {
      expect(sanitizePassword('a'.repeat(129)).ok).toBe(false);
    });
  });

  describe('stripNullBytes', () => {
    it('null byte를 제거한다', () => {
      expect(stripNullBytes('abc\0def')).toBe('abcdef');
    });
  });
});
