const PostModel = require('../models/postModel');

const postController = {
  // GET /api/posts
  getAll: (req, res) => {
    res.json(PostModel.findAll());
  },

  // GET /api/posts/:id
  getOne: (req, res) => {
    const post = PostModel.findById(Number(req.params.id));
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    res.json(post);
  },

  // POST /api/posts  { title, body }
  create: (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'title, body 는 필수입니다.' });
    const post = PostModel.create({ title, body });
    res.status(201).json(post);
  },

  // DELETE /api/posts/:id
  delete: (req, res) => {
    const ok = PostModel.delete(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    res.json({ message: '삭제 완료' });
  },
};

module.exports = postController;
