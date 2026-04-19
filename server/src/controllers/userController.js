const UserModel = require('../models/userModel');

const userController = {
  // GET /api/users
  getAll: (req, res) => {
    res.json(UserModel.findAll());
  },

  // GET /api/users/:id
  getOne: (req, res) => {
    const user = UserModel.findById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    res.json(user);
  },

  // POST /api/users  { name, email }
  create: (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'name, email 은 필수입니다.' });
    const user = UserModel.create({ name, email });
    res.status(201).json(user);
  },

  // DELETE /api/users/:id
  delete: (req, res) => {
    const ok = UserModel.delete(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    res.json({ message: '삭제 완료' });
  },
};

module.exports = userController;
