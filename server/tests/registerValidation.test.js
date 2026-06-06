const {
  validatePassword,
  buildCampusEmail,
  validateName,
  validateDepartmentId,
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

  describe('validateDepartmentId', () => {
    it('양의 정수 departmentId를 허용한다', () => {
      const result = validateDepartmentId('6');
      expect(result.ok).toBe(true);
      expect(result.value).toBe(6);
    });

    it('잘못된 departmentId를 거부한다', () => {
      expect(validateDepartmentId('abc').ok).toBe(false);
      expect(validateDepartmentId(0).ok).toBe(false);
    });
  });

  describe('validateName', () => {
    it('이름을 허용한다', () => {
      expect(validateName('홍길동').ok).toBe(true);
    });
  });
});
