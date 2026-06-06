const AcademicModel = require('../models/academicModel');

const dashboardController = {
  getAcademicSummary: async (req, res, next) => {
    try {
      const summary = await AcademicModel.getDashboardSummary(req.user.id);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  getMyPageProfile: async (req, res, next) => {
    try {
      const profile = await AcademicModel.getMyPageProfile(req.user.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = dashboardController;
