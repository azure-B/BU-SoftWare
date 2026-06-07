const ReservationModel = require('../models/reservationModel');
const FacilityModel = require('../models/facilityModel');

const reservationController = {
  getFacilities: async (req, res, next) => {
    try {
      const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;

      if (!departmentId) {
        return res.status(400).json({ message: 'departmentId 쿼리가 필요합니다.' });
      }

      const payload = await FacilityModel.findFacilitiesForDepartment(departmentId);
      res.json(payload);
    } catch (err) {
      next(err);
    }
  },

  getMyReservations: async (req, res, next) => {
    try {
      const rows = await ReservationModel.findMyReservations(req.user.id);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  getBookedSlots: async (req, res, next) => {
    try {
      const { facilitySlug, date } = req.query;
      if (!facilitySlug || !date) {
        return res.status(400).json({ message: 'facilitySlug, date 쿼리가 필요합니다.' });
      }

      const slots = await ReservationModel.findBookedSlots({
        facilitySlug: String(facilitySlug),
        date: String(date),
      });
      res.json({ timeSlots: slots });
    } catch (err) {
      next(err);
    }
  },

  createReservation: async (req, res, next) => {
    try {
      if (!Array.isArray(req.body.timeSlots) || req.body.timeSlots.length === 0) {
        return res.status(400).json({
          message: 'timeSlots 배열이 필요합니다.',
          fields: ['timeSlots'],
        });
      }

      const reservation = await ReservationModel.createReservation({
        userId: req.user.id,
        facilitySlug: req.body.facilitySlug,
        date: req.body.date,
        timeSlots: req.body.timeSlots,
      });
      res.status(201).json(reservation);
    } catch (err) {
      next(err);
    }
  },

  getDashboardStatus: async (req, res, next) => {
    try {
      const rows = await ReservationModel.findDashboardStatus(req.user?.id ?? null);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reservationController;
