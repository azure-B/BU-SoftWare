const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../src/models/adminModel', () => ({
  isUserAdmin: jest.fn(),
  getStats: jest.fn(),
  createDashboardNotice: jest.fn(),
  createFacility: jest.fn(),
  reviewReservation: jest.fn(),
  DASHBOARD_NOTICE_BOARD_ID: 100,
}));

const AdminModel = require('../src/models/adminModel');
const app = require('../src/app');

function authHeader(userId = 1, studentId = 'admin') {
  const token = jwt.sign({ userId, studentId }, process.env.JWT_SECRET || 'test-secret');
  return `Bearer ${token}`;
}

describe('Admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('GET /api/admin/stats', () => {
    it('토큰 없으면 401을 반환한다', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('관리자가 아니면 403을 반환한다', async () => {
      AdminModel.isUserAdmin.mockResolvedValue(false);

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/notices', () => {
    it('제목 없으면 400을 반환한다', async () => {
      AdminModel.isUserAdmin.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/admin/notices')
        .set('Authorization', authHeader())
        .send({ title: '', content: '본문' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/notices/:id', () => {
    it('유효하지 않은 id면 400을 반환한다', async () => {
      AdminModel.isUserAdmin.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/admin/notices/abc')
        .set('Authorization', authHeader());

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/facilities/:id', () => {
    it('유효하지 않은 id면 400을 반환한다', async () => {
      AdminModel.isUserAdmin.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/admin/facilities/0')
        .set('Authorization', authHeader());

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/reservations/:id', () => {
    it('반려 시 사유 없으면 400을 반환한다', async () => {
      AdminModel.isUserAdmin.mockResolvedValue(true);
      AdminModel.reviewReservation.mockRejectedValue(
        Object.assign(new Error('반려 사유를 입력해 주세요.'), { status: 400 }),
      );

      const res = await request(app)
        .patch('/api/admin/reservations/1')
        .set('Authorization', authHeader())
        .send({ status: 'REJECTED', rejectReason: '' });

      expect(res.status).toBe(400);
    });
  });
});
