const express = require('express');
const reservationController = require('../controllers/reservationController');
const optionalAuth = require('../middlewares/optionalAuth');
const requireAuth = require('../middlewares/requireAuth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.get('/facilities', optionalAuth, reservationController.getFacilities);
router.get('/dashboard-status', optionalAuth, reservationController.getDashboardStatus);
router.get('/mine', requireAuth, reservationController.getMyReservations);
router.get('/booked-slots', optionalAuth, reservationController.getBookedSlots);
router.post(
  '/',
  requireAuth,
  validate('facilitySlug', 'date'),
  reservationController.createReservation,
);

module.exports = router;
