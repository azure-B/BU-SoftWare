const path = require('path');
const HomeModel = require('../models/homeModel');

const homeController = {
  // GET / → index.html 서빙
  index: (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  },

  // GET /api/hello → JSON 응답
  hello: (req, res) => {
    const data = HomeModel.getGreeting();
    res.json(data);
  },
};

module.exports = homeController;
