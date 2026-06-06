const nodemailer = require('nodemailer');

let transporter = null;

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** 465 → SSL, 587 → STARTTLS (명시 env 우선) */
function resolveSecure(port) {
  if (process.env.SMTP_SECURE === 'true') return true;
  if (process.env.SMTP_SECURE === 'false') return false;
  return port === 465;
}

/**
 * Gmail 등 SMTP는 발신 주소가 로그인 계정과 같아야 함.
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
  if (!isMailConfigured()) return null;

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

async function sendVerificationEmail(to, code) {
  const from = resolveFromAddress();
  const subject = '[백석 학생 허브] 이메일 인증번호';
  const text = `회원가입 인증번호: ${code}\n\n5분 이내에 입력해 주세요.`;
  const html = `
    <p>회원가입 인증번호</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
    <p>5분 이내에 입력해 주세요.</p>
  `;

  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV mail] To: ${to} | Code: ${code}`);
      return { dev: true };
    }
    const err = new Error('SMTP is not configured');
    err.status = 500;
    throw err;
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
    return { dev: false };
  } catch (err) {
    console.error('[SMTP error]', err.message);

    let message = '이메일 발송에 실패했습니다. SMTP 설정을 확인해 주세요.';
    if (process.env.NODE_ENV === 'development') {
      message = `이메일 발송 실패: ${err.message}`;
    }
    const smtpErr = String(err.message);
    const isGmail = String(process.env.SMTP_HOST || '').includes('gmail.com');
    if (
      smtpErr.includes('535')
      || smtpErr.includes('EAUTH')
      || smtpErr.includes('Invalid login')
      || smtpErr.includes('Authentication')
    ) {
      message = isGmail
        ? 'Gmail SMTP 로그인 실패. Google 계정 2단계 인증 ON 후 '
          + '「앱 비밀번호」를 발급해 SMTP_PASS에 넣어 주세요. '
          + '일반 로그인 비밀번호는 사용할 수 없습니다.'
        : 'SMTP 로그인 실패. 앱 비밀번호(또는 SMTP 전용 비밀번호)를 SMTP_PASS에 설정했는지 확인해 주세요.';
    }
    if (smtpErr.includes('timeout') || smtpErr.includes('Timeout')) {
      message =
        'SMTP 서버 연결 시간 초과입니다. SMTP_HOST·PORT·SMTP_SECURE 값과 '
        + 'Render 환경 변수 설정을 확인해 주세요.';
    }

    const wrapped = new Error(message);
    wrapped.status = 502;
    throw wrapped;
  }
}

module.exports = {
  sendVerificationEmail,
  isMailConfigured,
  resolveFromAddress,
  resolveSecure,
  getTransporter,
};
