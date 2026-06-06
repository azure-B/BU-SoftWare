const TourModel = require('../models/tourModel');

const tourController = {
  getPlaces: async (req, res, next) => {
    try {
      const { places, topTags } = await TourModel.findPlaces();
      res.json({ places, topTags });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = tourController;
