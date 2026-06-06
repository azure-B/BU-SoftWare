const request = require('supertest');

jest.mock('../src/models/registerModel');
jest.mock('../src/config/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ dev: false, provider: 'gmail-api' }),
}));

const RegisterModel = require('../src/models/registerModel');
const { sendVerificationEmail } = require('../src/config/mailer');
const app = require('../src/app');

describe('Recover API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('POST /api/auth/recover/find-id/send-code', () => {
    it('가입된 이메일과 이름이 일치하면 인증번호를 발송한다', async () => {
      RegisterModel.findUserForRecovery.mockResolvedValue({
        id: 1,
        student_id: '20240001',
        name: '홍길동',
        email: 'hong@bu.ac.kr',
      });
      RegisterModel.getLatestVerification.mockResolvedValue(null);
      RegisterModel.createVerification.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/auth/recover/find-id/send-code')
        .send({ name: '홍길동', emailLocal: 'hong' });

      expect(res.status).toBe(200);
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('가입되지 않은 이메일이면 404를 반환한다', async () => {
      RegisterModel.findUserForRecovery.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/recover/find-id/send-code')
        .send({ name: '홍길동', emailLocal: 'unknown' });

      expect(res.status).toBe(404);
    });
  });
});
