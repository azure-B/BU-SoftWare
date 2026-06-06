const {
  validatePassword,
  buildCampusEmail,
  validateName,
  validateDepartmentSlug,
  validateVerificationCode,
} = require('../src/utils/registerValidation');

describe('registerValidation', () => {
  describe('validatePassword', () => {
    it('8자 이상 + 특수문자를 허용한다', () => {
      expect(validatePassword('abcd1234!').ok).toBe(true);
    });

    it('7자 이하면 거부한다', () => {
      expect(validatePassword('abc12!').ok).toBe(false);
    });

    it('특수문자 없으면 거부한다', () => {
      expect(validatePassword('abcd1234').ok).toBe(false);
    });
  });

  describe('buildCampusEmail', () => {
    it('@bu.ac.kr 이메일을 만든다', () => {
      expect(buildCampusEmail('hong').value).toBe('hong@bu.ac.kr');
    });

    it('잘못된 local part를 거부한다', () => {
      expect(buildCampusEmail('bad@id').ok).toBe(false);
    });
  });

  describe('validateVerificationCode', () => {
    it('6자리 숫자를 허용한다', () => {
      expect(validateVerificationCode('123456').ok).toBe(true);
    });

    it('5자리는 거부한다', () => {
      expect(validateVerificationCode('12345').ok).toBe(false);
    });
  });

  describe('validateDepartmentSlug', () => {
    it('등록된 학과 slug를 허용한다', () => {
      const result = validateDepartmentSlug('computer_science');
      expect(result.ok).toBe(true);
      expect(result.label).toBe('컴퓨터공학부');
    });
  });

  describe('validateName', () => {
    it('이름을 허용한다', () => {
      expect(validateName('홍길동').ok).toBe(true);
    });
  });
});
