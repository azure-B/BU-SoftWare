const request = require('supertest');
const app     = require('../src/app');

describe('Posts API', () => {

  describe('GET /api/posts', () => {
    it('게시글 목록을 배열로 반환한다', async () => {
      const res = await request(app).get('/api/posts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/posts', () => {
    it('유효한 데이터로 게시글을 생성한다', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: '테스트 제목', body: '테스트 내용' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: '테스트 제목', body: '테스트 내용' });
      expect(res.body.createdAt).toBeDefined();
    });

    it('title 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ body: '내용만 있음' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('title');
    });

    it('body 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: '제목만 있음' });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('body');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('존재하는 게시글을 반환한다', async () => {
      const res = await request(app).get('/api/posts/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('없는 게시글 조회 시 404를 반환한다', async () => {
      const res = await request(app).get('/api/posts/9999');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('게시글을 삭제한다', async () => {
      const created = await request(app)
        .post('/api/posts')
        .send({ title: '삭제할 글', body: '삭제 테스트' });

      const res = await request(app).delete(`/api/posts/${created.body.id}`);
      expect(res.status).toBe(200);
    });

    it('없는 게시글 삭제 시 404를 반환한다', async () => {
      const res = await request(app).delete('/api/posts/9999');
      expect(res.status).toBe(404);
    });
  });

});
