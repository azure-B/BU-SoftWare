const express = require('express');
const faqController = require('../controllers/faqController');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.get('/suggestions', faqController.getSuggestions);
router.post('/ask', validate('message'), faqController.ask);

module.exports = router;
