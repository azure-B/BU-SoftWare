const FaqModel = require('../models/faqModel');

const faqController = {
  /** GET /api/faq/suggestions */
  getSuggestions: (req, res) => {
    res.json({ suggestions: FaqModel.getSuggestions() });
  },

  /** POST /api/faq/ask */
  ask: (req, res) => {
    const message = String(req.body.message || '').trim();
    const result = FaqModel.findAnswer(message);
    res.json({
      answer: result.answer,
      matched: result.matched,
      category: result.category || null,
    });
  },
};

module.exports = faqController;
