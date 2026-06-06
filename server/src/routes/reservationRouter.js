const express = require('express');
const reservationController = require('../controllers/reservationController');
const optionalAuth = require('../middlewares/optionalAuth');

const router = express.Router();

router.get('/dashboard-status', optionalAuth, reservationController.getDashboardStatus);

module.exports = router;
