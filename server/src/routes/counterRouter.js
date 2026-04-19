const express = require('express');
const router  = express.Router();
const counterController         = require('../controllers/counterController');
const { validate, validateNumbers } = require('../middlewares/validate');

router.get('/',         counterController.get);
router.post('/adjust',  validate('delta'), validateNumbers('delta'), counterController.adjust);
router.post('/reset',   counterController.reset);

module.exports = router;
