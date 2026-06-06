const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/academic', requireAuth, dashboardController.getAcademicSummary);
router.get('/mypage', requireAuth, dashboardController.getMyPageProfile);

module.exports = router;
