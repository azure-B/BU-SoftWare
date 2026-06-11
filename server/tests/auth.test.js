const request = require('supertest');

jest.mock('../src/models/authModel');
jest.mock('../src/models/adminModel');

const AuthModel = require('../src/models/authModel');
const AdminModel = require('../src/models/adminModel');
const app = require('../src/app');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    AdminModel.isUserAdmin.mockResolvedValue(false);
  });

  describe('POST /api/auth/login', () => {
    it('유효한 학번·비밀번호로 로그인한다', async () => {
      AuthModel.findByStudentId.mockResolvedValue({
        id: 1,
        student_id: '20240001',
        password: 'hashed',
        name: '김백석',
        department_id: 1,
        department_name: '컴퓨터공학부',
      });
      AuthModel.verifyPassword.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '20240001', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        id: 1,
        studentId: '20240001',
        name: '김백석',
        departmentId: 1,
        departmentName: '컴퓨터공학부',
      });
    });

    it('studentId 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('studentId');
    });

    it('password 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '20240001' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('password');
    });

    it('존재하지 않는 학번이면 401을 반환한다', async () => {
      AuthModel.findByStudentId.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '99999999', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/학번 또는 비밀번호/);
    });

    it('비밀번호가 틀리면 401을 반환한다', async () => {
      AuthModel.findByStudentId.mockResolvedValue({
        id: 1,
        student_id: '20240001',
        password: 'hashed',
        name: '김백석',
        department_id: 1,
        department_name: '컴퓨터공학부',
      });
      AuthModel.verifyPassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '20240001', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('SQL Injection 형태 학번이면 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: "20240001' OR '1'='1", password: 'password123' });

      expect(res.status).toBe(400);
      expect(AuthModel.findByStudentId).not.toHaveBeenCalled();
    });

    it('객체 타입 studentId면 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: { $gt: '' }, password: 'password123' });

      expect(res.status).toBe(400);
    });
  });
});
