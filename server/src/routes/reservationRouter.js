const express = require('express');
const reservationController = require('../controllers/reservationController');

const router = express.Router();

router.get('/dashboard-status', reservationController.getDashboardStatus);

module.exports = router;
