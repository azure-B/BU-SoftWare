const jwt = require('jsonwebtoken');
const RegisterModel = require('../models/registerModel');
const AcademicModel = require('../models/academicModel');
const { sendVerificationEmail } = require('../config/mailer');
const { sanitizeStudentId } = require('../utils/sanitize');
const {
  buildCampusEmail,
  validateName,
  validateDepartmentSlug,
  validateVerificationCode,
  validatePassword,
  generateVerificationCode,
} = require('../utils/registerValidation');

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_TOKEN_TTL = '15m';

function signVerificationToken(email) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    throw err;
  }
  return jwt.sign({ email, purpose: 'register' }, secret, {
    expiresIn: VERIFICATION_TOKEN_TTL,
  });
}

function verifyRegistrationToken(token) {
  const secret = process.env.JWT_SECRET;
  const payload = jwt.verify(token, secret);
  if (payload.purpose !== 'register' || !payload.email) {
    const err = new Error('Invalid verification token');
    err.status = 400;
    throw err;
  }
  return payload.email;
}

const registerController = {
  // GET /api/auth/register/check-duplicate?studentId=&emailLocal=
  checkDuplicate: async (req, res, next) => {
    try {
      const studentResult = req.query.studentId
        ? sanitizeStudentId(String(req.query.studentId))
        : null;
      const emailResult = req.query.emailLocal
        ? buildCampusEmail(String(req.query.emailLocal))
        : null;

      const result = {
        studentIdAvailable: null,
        emailAvailable: null,
      };

      if (studentResult) {
        if (!studentResult.ok) {
          return res.status(400).json({ message: studentResult.message });
        }
        const existing = await RegisterModel.findByStudentId(studentResult.value);
        result.studentIdAvailable = !existing;
      }

      if (emailResult) {
        if (!emailResult.ok) {
          return res.status(400).json({ message: emailResult.message });
        }
        const existing = await RegisterModel.findByEmail(emailResult.value);
        result.emailAvailable = !existing;
      }

      if (result.studentIdAvailable === null && result.emailAvailable === null) {
        return res.status(400).json({ message: 'studentId 또는 emailLocal을 입력해 주세요.' });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/register/send-code { emailLocal }
  sendCode: async (req, res, next) => {
    try {
      const emailResult = buildCampusEmail(req.body.emailLocal);
      if (!emailResult.ok) {
        return res.status(400).json({ message: emailResult.message });
      }
      const email = emailResult.value;

      const existingUser = await RegisterModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
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
      // 메일 발송 성공 후 DB 저장 — SMTP 실패 시 쿨다운에 걸리지 않도록
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

  // POST /api/auth/register/verify-code { emailLocal, code }
  verifyCode: async (req, res, next) => {
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
      const verificationToken = signVerificationToken(email);

      res.json({
        message: '이메일 인증이 완료되었습니다.',
        verified: true,
        verificationToken,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/register
  register: async (req, res, next) => {
    try {
      let verifiedEmail;
      try {
        verifiedEmail = verifyRegistrationToken(req.body.verificationToken);
      } catch {
        return res.status(400).json({ message: '이메일 인증을 완료해 주세요.' });
      }

      const nameResult = validateName(req.body.name);
      if (!nameResult.ok) {
        return res.status(400).json({ message: nameResult.message });
      }

      const studentResult = sanitizeStudentId(req.body.studentId);
      if (!studentResult.ok) {
        return res.status(400).json({ message: studentResult.message });
      }

      const deptResult = validateDepartmentSlug(req.body.department);
      if (!deptResult.ok) {
        return res.status(400).json({ message: deptResult.message });
      }

      const emailResult = buildCampusEmail(req.body.emailLocal);
      if (!emailResult.ok) {
        return res.status(400).json({ message: emailResult.message });
      }
      if (emailResult.value !== verifiedEmail) {
        return res.status(400).json({ message: '인증된 이메일과 일치하지 않습니다.' });
      }

      const passwordResult = validatePassword(req.body.password);
      if (!passwordResult.ok) {
        return res.status(400).json({ message: passwordResult.message });
      }
      if (req.body.password.trim() !== req.body.confirmPassword?.trim()) {
        return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      const [studentDup, emailDup] = await Promise.all([
        RegisterModel.findByStudentId(studentResult.value),
        RegisterModel.findByEmail(emailResult.value),
      ]);

      if (studentDup) {
        return res.status(409).json({ message: '이미 사용 중인 학번입니다.' });
      }
      if (emailDup) {
        return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
      }

      const latestVerification = await RegisterModel.getLatestVerification(emailResult.value);
      if (!latestVerification?.verified) {
        return res.status(400).json({ message: '이메일 인증을 완료해 주세요.' });
      }

      const department = await RegisterModel.ensureDepartment(deptResult.label);
      const user = await RegisterModel.createUser({
        departmentId: department.id,
        studentId: studentResult.value,
        password: passwordResult.value,
        name: nameResult.value,
        email: emailResult.value,
      });

      await AcademicModel.createDefaultProfile(user.id);

      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          studentId: user.student_id,
          name: user.name,
          email: user.email,
          departmentId: user.department_id,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = registerController;
