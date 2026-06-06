const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const { sanitizeAuthLogin } = require('../middlewares/sanitizeAuth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 로그인 / 인증
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 학번·비밀번호 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 학번 또는 비밀번호 불일치
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', sanitizeAuthLogin, validate('studentId', 'password'), authController.login);

module.exports = router;
