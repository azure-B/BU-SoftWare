const CounterModel = require('../models/counterModel');

const counterController = {
  // GET /api/counter
  get: (req, res) => {
    res.json({ count: CounterModel.get() });
  },

  // POST /api/counter/adjust  { delta: number }
  adjust: (req, res) => {
    const delta = Number(req.body.delta);
    if (isNaN(delta)) return res.status(400).json({ message: 'delta 는 숫자여야 합니다.' });
    res.json({ count: CounterModel.adjust(delta) });
  },

  // POST /api/counter/reset
  reset: (req, res) => {
    res.json({ count: CounterModel.reset() });
  },
};

module.exports = counterController;
