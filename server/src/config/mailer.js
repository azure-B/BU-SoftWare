const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let transporter = null;
let resendClient = null;

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isMailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function getResendClient() {
  if (!isResendConfigured()) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/** Resend 발신 주소 — RESEND_FROM 또는 "이름 <email@domain>" */
function resolveResendFrom() {
  const raw = (process.env.RESEND_FROM || process.env.SMTP_FROM || '').trim();
  if (!raw) {
    return '백석 학생 허브 <onboarding@resend.dev>';
  }
  if (raw.includes('<') && raw.includes('@')) {
    return raw;
  }
  if (raw.includes('@')) {
    return raw;
  }
  const label = raw.replace(/^["']|["']$/g, '');
  return `${label} <onboarding@resend.dev>`;
}

/** 465 → SSL, 587 → STARTTLS (명시 env 우선) */
function resolveSecure(port) {
  if (process.env.SMTP_SECURE === 'true') return true;
  if (process.env.SMTP_SECURE === 'false') return false;
  return port === 465;
}

/**
 * 네이버 등 SMTP는 발신 주소가 로그인 계정과 같아야 함.
 * SMTP_FROM에 @ 없으면 "표시이름" <SMTP_USER> 형식으로 보정
 */
function resolveFromAddress() {
  const user = process.env.SMTP_USER;
  const raw = process.env.SMTP_FROM;

  if (!raw) return user;
  if (raw.includes('<') && raw.includes('@')) return raw;
  if (raw.includes('@')) return raw;

  const label = raw.replace(/^["']|["']$/g, '');
  return `"${label}" <${user}>`;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isSmtpConfigured()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = resolveSecure(port);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(port === 587 && {
      requireTLS: true,
      tls: { minVersion: 'TLSv1.2' },
    }),
  });

  return transporter;
}

function buildVerificationContent(code) {
  const subject = '[백석 학생 허브] 이메일 인증번호';
  const text = `회원가입 인증번호: ${code}\n\n5분 이내에 입력해 주세요.`;
  const html = `
    <p>회원가입 인증번호</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
    <p>5분 이내에 입력해 주세요.</p>
  `;
  return { subject, text, html };
}

async function sendViaResend(to, subject, text, html) {
  const client = getResendClient();
  const from = resolveResendFrom();

  const { data, error } = await client.emails.send({
    from,
    to: [to],
    subject,
    text,
    html,
  });

  if (error) {
    console.error('[Resend error]', error.message || error);
    let message = '이메일 발송에 실패했습니다. Resend 설정을 확인해 주세요.';
    if (process.env.NODE_ENV === 'development') {
      message = `Resend 발송 실패: ${error.message || error}`;
    }
    const wrapped = new Error(message);
    wrapped.status = 502;
    throw wrapped;
  }

  return { dev: false, provider: 'resend', id: data?.id };
}

async function sendViaSmtp(to, subject, text, html) {
  const from = resolveFromAddress();
  const transport = getTransporter();
  if (!transport) {
    const err = new Error('SMTP is not configured');
    err.status = 500;
    throw err;
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
    return { dev: false, provider: 'smtp' };
  } catch (err) {
    console.error('[SMTP error]', err.message);

    let message = '이메일 발송에 실패했습니다. SMTP 설정을 확인해 주세요.';
    if (process.env.NODE_ENV === 'development') {
      message = `이메일 발송 실패: ${err.message}`;
    }
    if (String(err.message).includes('535')) {
      message =
        '네이버 SMTP 로그인 거부(535). 네이버 2단계 인증 후 '
        + '「애플리케이션 비밀번호」를 발급해 SMTP_PASS에 넣어 주세요. '
        + '일반 로그인 비밀번호는 사용할 수 없습니다.';
    }

    const wrapped = new Error(message);
    wrapped.status = 502;
    throw wrapped;
  }
}

async function sendVerificationEmail(to, code) {
  const { subject, text, html } = buildVerificationContent(code);

  if (isResendConfigured()) {
    return sendViaResend(to, subject, text, html);
  }

  if (isSmtpConfigured()) {
    return sendViaSmtp(to, subject, text, html);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV mail] To: ${to} | Code: ${code}`);
    return { dev: true, provider: 'console' };
  }

  const err = new Error(
    'RESEND_API_KEY 또는 SMTP 설정이 필요합니다. Render 환경 변수를 확인해 주세요.',
  );
  err.status = 500;
  throw err;
}

module.exports = {
  sendVerificationEmail,
  isMailConfigured,
  isResendConfigured,
  isSmtpConfigured,
  resolveFromAddress,
  resolveResendFrom,
  resolveSecure,
  getTransporter,
  getResendClient,
};
