const request = require('supertest');

jest.mock('../src/models/registerModel');
jest.mock('../src/models/academicModel');
jest.mock('../src/config/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ dev: true }),
}));

const RegisterModel = require('../src/models/registerModel');
const AcademicModel = require('../src/models/academicModel');
const { sendVerificationEmail } = require('../src/config/mailer');
const app = require('../src/app');

describe('Register API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('GET /api/auth/register/check-duplicate', () => {
    it('학번 중복 여부를 반환한다', async () => {
      RegisterModel.findByStudentId.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/register/check-duplicate')
        .query({ studentId: '20249999' });

      expect(res.status).toBe(200);
      expect(res.body.studentIdAvailable).toBe(true);
    });

    it('이메일 중복 여부를 반환한다', async () => {
      RegisterModel.findByEmail.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .get('/api/auth/register/check-duplicate')
        .query({ emailLocal: 'testuser' });

      expect(res.status).toBe(200);
      expect(res.body.emailAvailable).toBe(false);
    });
  });

  describe('POST /api/auth/register/send-code', () => {
    it('인증번호를 발송한다', async () => {
      RegisterModel.findByEmail.mockResolvedValue(null);
      RegisterModel.getLatestVerification.mockResolvedValue(null);
      RegisterModel.createVerification.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/auth/register/send-code')
        .send({ emailLocal: 'newuser' });

      expect(res.status).toBe(200);
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('중복 이메일이면 409를 반환한다', async () => {
      RegisterModel.findByEmail.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/auth/register/send-code')
        .send({ emailLocal: 'existing' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/register/verify-code', () => {
    it('올바른 코드면 verificationToken을 반환한다', async () => {
      RegisterModel.getLatestVerification.mockResolvedValue({
        id: 1,
        code: '123456',
        expires_at: new Date(Date.now() + 60000).toISOString(),
      });
      RegisterModel.markVerificationVerified.mockResolvedValue({ id: 1, verified: true });

      const res = await request(app)
        .post('/api/auth/register/verify-code')
        .send({ emailLocal: 'newuser', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.verificationToken).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('인증·검증을 통과하면 회원을 생성한다', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { email: 'newuser@bu.ac.kr', purpose: 'register' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' },
      );

      RegisterModel.findByStudentId.mockResolvedValue(null);
      RegisterModel.findByEmail.mockResolvedValue(null);
      RegisterModel.getLatestVerification.mockResolvedValue({ verified: true });
      RegisterModel.ensureDepartment.mockResolvedValue({ id: 1, name: '컴퓨터공학부' });
      RegisterModel.createUser.mockResolvedValue({
        id: 2,
        student_id: '20249999',
        name: '신규',
        email: 'newuser@bu.ac.kr',
        department_id: 1,
      });
      AcademicModel.createDefaultProfile.mockResolvedValue({
        graduationSeeded: true,
        enrollmentsSeeded: 3,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          verificationToken: token,
          name: '신규',
          studentId: '20249999',
          department: 'computer_science',
          emailLocal: 'newuser',
          password: 'pass1234!',
          confirmPassword: 'pass1234!',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.studentId).toBe('20249999');
    });

    it('약한 비밀번호면 400을 반환한다', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { email: 'newuser@bu.ac.kr', purpose: 'register' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' },
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          verificationToken: token,
          name: '신규',
          studentId: '20249999',
          department: 'computer_science',
          emailLocal: 'newuser',
          password: '12345678',
          confirmPassword: '12345678',
        });

      expect(res.status).toBe(400);
    });
  });
});
