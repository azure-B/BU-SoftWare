const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const { validate, validateNumbers } = require('../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Register
 *   description: 회원가입 / 이메일 인증
 */

router.get('/departments', registerController.listDepartments);

/**
 * @swagger
 * /api/auth/register/check-duplicate:
 *   get:
 *     summary: 학번·이메일 중복 검사
 *     tags: [Register]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *       - in: query
 *         name: emailLocal
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 중복 검사 결과
 */
router.get('/check-duplicate', registerController.checkDuplicate);

/**
 * @swagger
 * /api/auth/register/send-code:
 *   post:
 *     summary: 이메일 인증번호 발송
 *     tags: [Register]
 */
router.post('/send-code', validate('emailLocal'), registerController.sendCode);

/**
 * @swagger
 * /api/auth/register/verify-code:
 *   post:
 *     summary: 이메일 인증번호 확인
 *     tags: [Register]
 */
router.post('/verify-code', validate('emailLocal', 'code'), registerController.verifyCode);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Register]
 */
router.post(
  '/',
  validate(
    'verificationToken',
    'name',
    'studentId',
    'departmentId',
    'emailLocal',
    'password',
    'confirmPassword',
  ),
  validateNumbers('departmentId'),
  registerController.register,
);

module.exports = router;
