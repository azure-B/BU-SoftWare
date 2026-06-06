const ReservationModel = require('../models/reservationModel');

const reservationController = {
  getDashboardStatus: async (req, res, next) => {
    try {
      const rows = await ReservationModel.findDashboardStatus();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reservationController;
