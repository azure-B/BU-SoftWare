const CommunityModel = require('../models/communityModel');
const BoardModel = require('../models/boardModel');
const { sanitizePostContent, isEmptyHtml } = require('../utils/sanitizeHtml');

function buildAccessContext(req) {
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;
  return {
    departmentId: Number.isInteger(departmentId) && departmentId > 0 ? departmentId : null,
    userId: req.user?.id ?? null,
  };
}

const communityController = {
  // GET /api/community/boards?departmentId=6
  getBoards: async (req, res, next) => {
    try {
      const departmentId = req.query.departmentId
        ? Number(req.query.departmentId)
        : null;

      if (!departmentId) {
        return res.status(400).json({ message: 'departmentId 쿼리가 필요합니다.' });
      }

      const boards = await BoardModel.findBoardMapForDepartment(departmentId);
      res.json(boards);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/community/admin-author
  getAdminAuthor: async (req, res, next) => {
    try {
      const adminUserId = await CommunityModel.findAdminAuthorId();
      res.json({ adminUserId });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/community/posts?boardKind=mentoring&departmentId=6
  //     or ?boardKinds=mentoring,team&departmentId=6
  //     or legacy ?boardId=3 / ?boardIds=3,4
  getPosts: async (req, res, next) => {
    try {
      const departmentId = req.query.departmentId
        ? Number(req.query.departmentId)
        : null;
      const posts = await CommunityModel.findPostsByBoardIds({
        boardId: req.query.boardId,
        boardIds: req.query.boardIds,
        boardKind: req.query.boardKind,
        boardKinds: req.query.boardKinds,
        departmentId,
      });
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/community/posts/:id — 조회 시 view_num +1
  getPost: async (req, res, next) => {
    try {
      const post = await CommunityModel.findPostByIdAndIncrementView(
        req.params.id,
        buildAccessContext(req),
      );
      res.json(post);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/community/posts — 커뮤니티(멘토링·팀프로젝트) 글 작성
  createPost: async (req, res, next) => {
    try {
      const title = String(req.body.title ?? '').trim();
      const content = sanitizePostContent(req.body.content);

      if (!title) {
        return res.status(400).json({ message: '제목을 입력해 주세요.' });
      }

      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '내용을 입력해 주세요.' });
      }

      const post = await CommunityModel.createPost({
        userId: req.user.id,
        boardId: req.body.boardId,
        title,
        content,
      });

      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  },

  getComments: async (req, res, next) => {
    try {
      const comments = await CommunityModel.findCommentsByPostId(
        req.params.id,
        buildAccessContext(req),
      );
      res.json(comments);
    } catch (err) {
      next(err);
    }
  },

  createComment: async (req, res, next) => {
    try {
      const content = sanitizePostContent(req.body.content);
      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '댓글 내용을 입력해 주세요.' });
      }

      const comment = await CommunityModel.createComment({
        postId: req.params.id,
        userId: req.user.id,
        content,
      });

      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  },

  deletePost: async (req, res, next) => {
    try {
      const result = await CommunityModel.deletePostByAuthor({
        postId: req.params.id,
        userId: req.user.id,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  updatePost: async (req, res, next) => {
    try {
      const title = String(req.body.title ?? '').trim();
      const content = sanitizePostContent(req.body.content);

      if (!title) {
        return res.status(400).json({ message: '제목을 입력해 주세요.' });
      }

      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '내용을 입력해 주세요.' });
      }

      const post = await CommunityModel.updatePostByAuthor({
        postId: req.params.id,
        userId: req.user.id,
        boardId: req.body.boardId,
        title,
        content,
      });

      res.json(post);
    } catch (err) {
      next(err);
    }
  },

  updateComment: async (req, res, next) => {
    try {
      const content = sanitizePostContent(req.body.content);
      if (isEmptyHtml(content)) {
        return res.status(400).json({ message: '댓글 내용을 입력해 주세요.' });
      }

      const comment = await CommunityModel.updateCommentByAuthor({
        commentId: req.params.commentId,
        userId: req.user.id,
        content,
      });

      res.json(comment);
    } catch (err) {
      next(err);
    }
  },

  deleteComment: async (req, res, next) => {
    try {
      const result = await CommunityModel.deleteCommentByAuthor({
        commentId: req.params.commentId,
        userId: req.user.id,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = communityController;
