const request = require('supertest');
const app     = require('../src/app');

describe('Counter API', () => {

  // 각 테스트 전 카운터 초기화
  beforeEach(async () => {
    await request(app).post('/api/counter/reset');
  });

  describe('GET /api/counter', () => {
    it('현재 카운터 값을 반환한다', async () => {
      const res = await request(app).get('/api/counter');
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
    });
  });

  describe('POST /api/counter/adjust', () => {
    it('양수 delta로 카운터를 증가시킨다', async () => {
      const res = await request(app)
        .post('/api/counter/adjust')
        .send({ delta: 5 });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(5);
    });

    it('음수 delta로 카운터를 감소시킨다', async () => {
      await request(app).post('/api/counter/adjust').send({ delta: 10 });

      const res = await request(app)
        .post('/api/counter/adjust')
        .send({ delta: -3 });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(7);
    });

    it('연속 adjust가 누적된다', async () => {
      await request(app).post('/api/counter/adjust').send({ delta: 2 });
      await request(app).post('/api/counter/adjust').send({ delta: 3 });
      const res = await request(app).get('/api/counter');
      expect(res.body.count).toBe(5);
    });

    it('delta 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/counter/adjust')
        .send({});

      expect(res.status).toBe(400);
    });

    it('delta가 숫자가 아니면 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/counter/adjust')
        .send({ delta: 'abc' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/counter/reset', () => {
    it('카운터를 0으로 초기화한다', async () => {
      await request(app).post('/api/counter/adjust').send({ delta: 99 });

      const res = await request(app).post('/api/counter/reset');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

});
