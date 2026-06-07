const request = require('supertest');
const app = require('../src/app');

describe('FAQ API', () => {
  describe('GET /api/faq/suggestions', () => {
    it('추천 질문 목록을 반환한다', async () => {
      const res = await request(app).get('/api/faq/suggestions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/faq/ask', () => {
    it('학과 사무실 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '컴퓨터공학부 사무실 어디?' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('컴퓨터공학부');
      expect(res.body.answer).toContain('본부동 716호');
      expect(res.body.matched).toBe('dept-computer');
    });

    it('통학버스 노선 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '교대 통학버스 시간' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('교대');
      expect(res.body.matched).toBe('shuttle-gyodae');
    });

    it('캠퍼스 셔틀 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '캠퍼스 셔틀 두정역' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('캠퍼스 셔틀버스');
      expect(res.body.matched).toBe('shuttle-campus');
    });

    it('학과 강의실 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '컴퓨터공학부 강의실 대여' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('컴퓨터공학부');
      expect(res.body.answer).toContain('본부동 710호');
      expect(res.body.matched).toBe('classroom-computer');
    });

    it('강의실 대여 일반 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '강의실 대여 방법' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('시설예약');
      expect(res.body.matched).toBe('classroom-overview');
    });

    it('병결 질문에 답한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '병결 서류 어떻게 제출해?' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('질병 결석');
      expect(res.body.answer).toContain('입원일로부터 2주 이내');
      expect(res.body.answer).toContain('자신의 학과사무실');
      expect(res.body.matched).toBe('absence-sick');
    });

    it('매칭되지 않으면 안내 메시지를 반환한다', async () => {
      const res = await request(app)
        .post('/api/faq/ask')
        .send({ message: '오늘 날씨 어때?' });

      expect(res.status).toBe(200);
      expect(res.body.matched).toBeNull();
      expect(res.body.answer).toContain('학과 사무실');
    });

    it('message 누락 시 400을 반환한다', async () => {
      const res = await request(app).post('/api/faq/ask').send({});
      expect(res.status).toBe(400);
    });
  });
});
