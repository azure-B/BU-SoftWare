const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const requireAuth = require('../middlewares/requireAuth');
const optionalAuth = require('../middlewares/optionalAuth');
const { validate, validateNumbers } = require('../middlewares/validate');

router.get('/departments', communityController.getDepartments);
router.get('/boards', communityController.getBoards);
router.get('/admin-author', communityController.getAdminAuthor);
router.get('/posts', communityController.getPosts);
router.post(
  '/posts',
  requireAuth,
  validate('title', 'content'),
  validateNumbers('boardId'),
  communityController.createPost,
);
router.get('/posts/:id/comments', optionalAuth, communityController.getComments);
router.post(
  '/posts/:id/comments',
  requireAuth,
  validate('content'),
  communityController.createComment,
);
router.patch(
  '/comments/:commentId',
  requireAuth,
  validate('content'),
  communityController.updateComment,
);
router.delete('/comments/:commentId', requireAuth, communityController.deleteComment);
router.patch(
  '/posts/:id',
  requireAuth,
  validate('title', 'content'),
  validateNumbers('boardId'),
  communityController.updatePost,
);
router.delete('/posts/:id', requireAuth, communityController.deletePost);
router.get('/posts/:id', optionalAuth, communityController.getPost);

module.exports = router;
