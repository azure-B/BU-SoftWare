const jwt = require('jsonwebtoken');
const RegisterModel = require('../models/registerModel');
const { sendVerificationEmail } = require('../config/mailer');
const {
  buildCampusEmail,
  validateName,
  validateVerificationCode,
  generateVerificationCode,
} = require('../utils/registerValidation');

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_TOKEN_TTL = '15m';

function signFindIdToken(email) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    throw err;
  }
  return jwt.sign({ email, purpose: 'find-id' }, secret, {
    expiresIn: VERIFICATION_TOKEN_TTL,
  });
}

function verifyFindIdToken(token) {
  const secret = process.env.JWT_SECRET;
  const payload = jwt.verify(token, secret);
  if (payload.purpose !== 'find-id' || !payload.email) {
    const err = new Error('Invalid verification token');
    err.status = 400;
    throw err;
  }
  return payload.email;
}

const recoverController = {
  // POST /api/auth/recover/find-id/send-code { emailLocal, name }
  sendFindIdCode: async (req, res, next) => {
    try {
      const nameResult = validateName(req.body.name);
      if (!nameResult.ok) {
        return res.status(400).json({ message: nameResult.message });
      }

      const emailResult = buildCampusEmail(req.body.emailLocal);
      if (!emailResult.ok) {
        return res.status(400).json({ message: emailResult.message });
      }
      const email = emailResult.value;

      const user = await RegisterModel.findUserForRecovery(email);
      if (!user) {
        return res.status(404).json({ message: '가입된 이메일을 찾을 수 없습니다.' });
      }
      if (user.name !== nameResult.value) {
        return res.status(400).json({ message: '입력한 이름이 가입 정보와 일치하지 않습니다.' });
      }

      const latest = await RegisterModel.getLatestVerification(email);
      if (latest?.created_at) {
        const elapsed = Date.now() - new Date(latest.created_at).getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
          return res.status(429).json({
            message: `인증번호는 ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)}초 후에 다시 요청할 수 있습니다.`,
            retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
          });
        }
      }

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);
      const mailResult = await sendVerificationEmail(email, code);
      await RegisterModel.createVerification({ email, code, expiresAt });

      res.json({
        message: '인증번호를 발송했습니다.',
        email,
        expiresInSec: CODE_TTL_MS / 1000,
        ...(mailResult.dev && { devNote: 'SMTP 미설정 — 서버 콘솔에서 인증번호를 확인하세요.' }),
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/recover/find-id/verify-code { emailLocal, code }
  verifyFindIdCode: async (req, res, next) => {
    try {
      const emailResult = buildCampusEmail(req.body.emailLocal);
      if (!emailResult.ok) {
        return res.status(400).json({ message: emailResult.message });
      }
      const codeResult = validateVerificationCode(req.body.code);
      if (!codeResult.ok) {
        return res.status(400).json({ message: codeResult.message });
      }

      const email = emailResult.value;
      const latest = await RegisterModel.getLatestVerification(email);
      if (!latest) {
        return res.status(400).json({ message: '인증번호를 먼저 요청해 주세요.' });
      }
      if (new Date(latest.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ message: '인증번호가 만료되었습니다. 다시 요청해 주세요.' });
      }
      if (latest.code !== codeResult.value) {
        return res.status(400).json({ message: '인증번호가 올바르지 않습니다.' });
      }

      await RegisterModel.markVerificationVerified(latest.id);
      const verificationToken = signFindIdToken(email);

      res.json({
        message: '이메일 인증이 완료되었습니다.',
        verified: true,
        verificationToken,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/recover/find-id { verificationToken, name }
  findStudentId: async (req, res, next) => {
    try {
      let verifiedEmail;
      try {
        verifiedEmail = verifyFindIdToken(req.body.verificationToken);
      } catch {
        return res.status(400).json({ message: '이메일 인증을 완료해 주세요.' });
      }

      const nameResult = validateName(req.body.name);
      if (!nameResult.ok) {
        return res.status(400).json({ message: nameResult.message });
      }

      const user = await RegisterModel.findUserForRecovery(verifiedEmail);
      if (!user) {
        return res.status(404).json({ message: '가입된 계정을 찾을 수 없습니다.' });
      }
      if (user.name !== nameResult.value) {
        return res.status(400).json({ message: '입력한 이름이 가입 정보와 일치하지 않습니다.' });
      }

      const latestVerification = await RegisterModel.getLatestVerification(verifiedEmail);
      if (!latestVerification?.verified) {
        return res.status(400).json({ message: '이메일 인증을 완료해 주세요.' });
      }

      res.json({
        message: '학번을 찾았습니다.',
        studentId: user.student_id,
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = recoverController;
