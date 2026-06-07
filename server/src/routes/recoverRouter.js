const express = require('express');
const router = express.Router();
const recoverController = require('../controllers/recoverController');
const { validate } = require('../middlewares/validate');
const { otpSendLimiter, otpVerifyLimiter } = require('../middlewares/rateLimit');

router.post(
  '/find-id/send-code',
  otpSendLimiter,
  validate('emailLocal', 'name'),
  recoverController.sendFindIdCode,
);

router.post(
  '/find-id/verify-code',
  otpVerifyLimiter,
  validate('emailLocal', 'code'),
  recoverController.verifyFindIdCode,
);

router.post(
  '/find-id',
  validate('verificationToken', 'name'),
  recoverController.findStudentId,
);

module.exports = router;
