const ReservationModel = require('../models/reservationModel');

const reservationController = {
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
