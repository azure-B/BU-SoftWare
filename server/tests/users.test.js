const request = require('supertest');
const app     = require('../src/app');

// 각 테스트마다 모델 상태를 초기화하기 위해 모듈 캐시를 지움
beforeEach(() => {
  jest.resetModules();
});

describe('Users API', () => {

  describe('GET /api/users', () => {
    it('유저 목록을 배열로 반환한다', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('유효한 데이터로 유저를 생성한다', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: '테스트 유저', email: 'test@example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name:  '테스트 유저',
        email: 'test@example.com',
      });
      expect(res.body.id).toBeDefined();
    });

    it('name 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('name');
    });

    it('email 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: '홍길동' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('email');
    });

    it('잘못된 이메일 형식 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: '홍길동', email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('존재하는 유저를 반환한다', async () => {
      const res = await request(app).get('/api/users/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('없는 유저 조회 시 404를 반환한다', async () => {
      const res = await request(app).get('/api/users/9999');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('유저를 삭제하고 메시지를 반환한다', async () => {
      // 먼저 생성
      const created = await request(app)
        .post('/api/users')
        .send({ name: '삭제대상', email: 'del@example.com' });

      const res = await request(app).delete(`/api/users/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('없는 유저 삭제 시 404를 반환한다', async () => {
      const res = await request(app).delete('/api/users/9999');
      expect(res.status).toBe(404);
    });
  });

});
