const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// GET /
router.get('/', homeController.index);

// GET /api/hello  (JSON 예시)
router.get('/api/hello', homeController.hello);

module.exports = router;
