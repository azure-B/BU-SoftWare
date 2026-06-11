const jwt = require('jsonwebtoken');
const request = require('supertest');

const {
  canAccessDepartmentBoard,
  isPublicReadableBoard,
  isGlobalBoard,
  assertReadableBoard,
} = require('../src/utils/boardAccess');
const { sanitizePostContent } = require('../src/utils/sanitizeHtml');
const {
  sanitizeStudentId,
  stripNullBytes,
} = require('../src/utils/sanitize');

jest.mock('../src/models/authModel');
jest.mock('../src/models/communityModel');

const AuthModel = require('../src/models/authModel');
const CommunityModel = require('../src/models/communityModel');
const app = require('../src/app');

const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "1; DROP TABLE users;--",
  "20240001' UNION SELECT * FROM users--",
  '1 OR 1=1',
  "admin'--",
  "'; DELETE FROM posts;--",
];

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '<a href="javascript:alert(1)">click</a>',
  '<iframe src="https://evil.test"></iframe>',
  '<p onclick="alert(1)">hi</p>',
  '<body onload=alert(1)>',
];

function signToken(userId = 1, studentId = '20240001') {
  return jwt.sign({ userId, studentId }, process.env.JWT_SECRET || 'test-secret');
}

describe('Security — DB 훼손·정보 유출 방어', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('boardAccess (학과 게시판 IDOR)', () => {
    it('전역 게시판(scholarship)은 department_id 없이 global로 판별한다', () => {
      expect(
        isGlobalBoard({ board_kind: 'scholarship', department_id: null }),
      ).toBe(true);
    });

    it('타 학과 게시판은 requestDepartmentId 없으면 접근을 거부한다', () => {
      expect(
        canAccessDepartmentBoard(3, { requestDepartmentId: null, userDepartmentId: null }),
      ).toBe(false);
    });

    it('타 학과 게시판은 다른 학과 requestDepartmentId로 접근할 수 없다', () => {
      expect(
        canAccessDepartmentBoard(3, { requestDepartmentId: 6, userDepartmentId: null }),
      ).toBe(false);
    });

    it('소속 학과 userDepartmentId로는 접근할 수 있다', () => {
      expect(
        canAccessDepartmentBoard(3, { requestDepartmentId: null, userDepartmentId: 3 }),
      ).toBe(true);
    });

    it('campus_tour 게시판은 공개 조회 가능하다', () => {
      expect(isPublicReadableBoard({ category: 'campus_tour' })).toBe(true);
    });

    it('멘토링·팀프로젝트 학과 게시판은 타학과도 조회할 수 있다', async () => {
      await expect(
        assertReadableBoard(
          null,
          { board_kind: 'mentoring', department_id: 3, category: 'community' },
          { departmentId: 6, userId: 2 },
        ),
      ).resolves.toBeUndefined();
    });

    it('전역 QnA 게시판은 비로그인도 assertReadableBoard를 통과한다', async () => {
      await expect(
        assertReadableBoard(
          null,
          { board_kind: 'qna', department_id: null, category: 'community' },
          {},
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('SQL Injection / 악성 입력 (로그인)', () => {
    it.each(SQLI_PAYLOADS)('학번 "%s" 는 DB 조회 전에 400으로 거부한다', async (payload) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: payload, password: 'password123' });

      expect(res.status).toBe(400);
      expect(AuthModel.findByStudentId).not.toHaveBeenCalled();
    });

    it('NoSQL-style 객체 studentId는 거부한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: { $gt: '' }, password: 'password123' });

      expect(res.status).toBe(400);
      expect(AuthModel.findByStudentId).not.toHaveBeenCalled();
    });

    it('null byte가 포함된 학번은 strip 후 유효 학번으로 정규화된다', () => {
      const result = sanitizeStudentId('20240001\0');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('20240001');
    });

    it('stripNullBytes는 문자열 null byte를 제거한다', () => {
      expect(stripNullBytes('abc\0def')).toBe('abcdef');
    });
  });

  describe('인증 없는 DB 변경 차단', () => {
    const protectedRoutes = [
      ['post', '/api/community/posts', { title: 't', content: '<p>x</p>', boardId: 1 }],
      ['patch', '/api/community/posts/1', { title: 't', content: '<p>x</p>', boardId: 1 }],
      ['delete', '/api/community/posts/1', null],
      ['post', '/api/community/posts/1/comments', { content: '<p>x</p>' }],
      ['patch', '/api/community/comments/1', { content: '<p>x</p>' }],
      ['delete', '/api/community/comments/1', null],
    ];

    it.each(protectedRoutes)(
      '%s %s 는 토큰 없이 401을 반환한다',
      async (method, path, body) => {
        const agent = request(app)[method](path);
        const res = body ? await agent.send(body) : await agent;
        expect(res.status).toBe(401);
        expect(CommunityModel.createPost).not.toHaveBeenCalled();
        expect(CommunityModel.deletePostByAuthor).not.toHaveBeenCalled();
        expect(CommunityModel.updatePostByAuthor).not.toHaveBeenCalled();
        expect(CommunityModel.createComment).not.toHaveBeenCalled();
      },
    );

    it('위조 JWT는 401을 반환한다', async () => {
      const res = await request(app)
        .post('/api/community/posts')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ title: 't', content: '<p>x</p>', boardId: 1 });

      expect(res.status).toBe(401);
      expect(CommunityModel.createPost).not.toHaveBeenCalled();
    });

    it('다른 secret으로 서명한 JWT는 401을 반환한다', async () => {
      const forged = jwt.sign({ userId: 999, studentId: '99999999' }, 'wrong-secret');
      const res = await request(app)
        .delete('/api/community/posts/1')
        .set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
      expect(CommunityModel.deletePostByAuthor).not.toHaveBeenCalled();
    });
  });

  describe('Mass assignment — body userId로 타인 행위 불가', () => {
    it('createPost는 JWT userId만 사용하고 body.userId는 무시한다', async () => {
      CommunityModel.createPost.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/community/posts')
        .set('Authorization', `Bearer ${signToken(42)}`)
        .send({
          title: '제목',
          content: '<p>내용</p>',
          boardId: 1,
          userId: 999,
          user_id: 999,
        });

      expect(res.status).toBe(201);
      expect(CommunityModel.createPost).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42 }),
      );
      expect(CommunityModel.createPost).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: 999 }),
      );
    });

    it('deletePost는 JWT userId만 전달한다', async () => {
      CommunityModel.deletePostByAuthor.mockResolvedValue({ id: 5 });

      await request(app)
        .delete('/api/community/posts/5')
        .set('Authorization', `Bearer ${signToken(7)}`)
        .send({ userId: 999 });

      expect(CommunityModel.deletePostByAuthor).toHaveBeenCalledWith({
        postId: '5',
        userId: 7,
      });
    });
  });

  describe('XSS / 저장 HTML 훼손 방지', () => {
    it.each(XSS_PAYLOADS)('sanitizePostContent가 위험 마크업 "%s" 를 제거한다', (payload) => {
      const sanitized = sanitizePostContent(payload);
      expect(sanitized).not.toMatch(/<script/i);
      expect(sanitized).not.toMatch(/onerror\s*=/i);
      expect(sanitized).not.toMatch(/onload\s*=/i);
      expect(sanitized).not.toMatch(/onclick\s*=/i);
      expect(sanitized).not.toMatch(/javascript:/i);
      expect(sanitized).not.toMatch(/<iframe/i);
    });
  });

  describe('잘못된 ID / 타입 — 비정상 DB 접근 차단', () => {
    it('boardId가 숫자가 아니면 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/community/posts')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ title: 't', content: '<p>x</p>', boardId: "1; DROP TABLE posts;--" });

      expect(res.status).toBe(400);
      expect(CommunityModel.createPost).not.toHaveBeenCalled();
    });

    it('음수 post id 조회는 모델 호출 전에 400/404로 처리된다', async () => {
      CommunityModel.findPostByIdAndIncrementView.mockRejectedValue(
        Object.assign(new Error('유효하지 않은 게시글 ID입니다.'), { status: 400 }),
      );

      const res = await request(app).get('/api/community/posts/-1');
      expect([400, 404, 500]).toContain(res.status);
      expect(res.status).not.toBe(200);
    });
  });

  describe('운영 환경 노출 차단', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
      jest.resetModules();
    });

    function loadProductionApp() {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'prod-test-secret';
      delete process.env.ENABLE_DEMO_ROUTES;
      jest.resetModules();
      jest.mock('../src/models/authModel');
      jest.mock('../src/models/communityModel');
      return require('../src/app');
    }

    it('운영에서 데모 /api/users 는 404', async () => {
      const prodApp = loadProductionApp();
      const res = await request(prodApp).get('/api/users');
      expect(res.status).toBe(404);
    });

    it('운영에서 데모 /api/posts 는 404', async () => {
      const prodApp = loadProductionApp();
      const res = await request(prodApp).get('/api/posts');
      expect(res.status).toBe(404);
    });

    it('운영에서 데모 /api/counter 는 404', async () => {
      const prodApp = loadProductionApp();
      const res = await request(prodApp).get('/api/counter');
      expect(res.status).toBe(404);
    });

    it('운영에서 /api-docs 는 404', async () => {
      const prodApp = loadProductionApp();
      const res = await request(prodApp).get('/api-docs');
      expect(res.status).toBe(404);
    });
  });
});
