const express = require('express');
const router = express.Router();
const recoverController = require('../controllers/recoverController');
const { validate } = require('../middlewares/validate');

router.post(
  '/find-id/send-code',
  validate('emailLocal', 'name'),
  recoverController.sendFindIdCode,
);

router.post(
  '/find-id/verify-code',
  validate('emailLocal', 'code'),
  recoverController.verifyFindIdCode,
);

router.post(
  '/find-id',
  validate('verificationToken', 'name'),
  recoverController.findStudentId,
);

module.exports = router;
