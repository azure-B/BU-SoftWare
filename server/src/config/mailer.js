const dns = require('dns');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

let transporter = null;

/** Render 등 IPv6 미지원 환경에서 smtp.gmail.com → ENETUNREACH 방지 */
async function resolveSmtpHost(host) {
  const records = await dns.promises.lookup(host, { family: 4 });
  return records.address;
}

function normalizeSmtpPass(pass) {
  return String(pass || '').replace(/\s+/g, '');
}

function isMailConfigured() {
  return isGmailApiConfigured()
    || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isGmailApiConfigured() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID
    && process.env.GMAIL_CLIENT_SECRET
    && process.env.GMAIL_REFRESH_TOKEN
    && process.env.GMAIL_USER,
  );
}

/** 465 → SSL, 587 → STARTTLS (명시 env 우선) */
function resolveSecure(port) {
  if (process.env.SMTP_SECURE === 'true') return true;
  if (process.env.SMTP_SECURE === 'false') return false;
  return port === 465;
}

function resolveRequireTls(port, secure) {
  if (secure) return false;
  if (process.env.SMTP_REQUIRE_TLS === 'true') return true;
  if (process.env.SMTP_REQUIRE_TLS === 'false') return false;
  return [587, 2525].includes(port);
}

/**
 * Gmail 등 SMTP는 발신 주소가 로그인 계정과 같아야 함.
 * SMTP_FROM에 @ 없으면 "표시이름" <SMTP_USER> 형식으로 보정
 */
function resolveFromAddress() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const raw = process.env.SMTP_FROM;

  if (!raw) return user;
  if (raw.includes('<') && raw.includes('@')) return raw;
  if (raw.includes('@')) return raw;

  const label = raw.replace(/^["']|["']$/g, '');
  return `"${label}" <${user}>`;
}

function encodeHeader(value) {
  return String(value).replace(/\r?\n/g, ' ');
}

function encodeMimeWord(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`;
}

function needsMimeEncoding(value) {
  return /[^\x20-\x7E]/.test(String(value));
}

/** Gmail API raw MIME — 한글 표시 이름은 RFC 2047 인코딩 필요 */
function formatAddressHeader(address) {
  const raw = String(address).trim();
  const match = raw.match(/^(?:"([^"]*)"|([^<]*?))\s*<([^>]+)>$/);

  if (match) {
    const displayName = (match[1] || match[2] || '').trim();
    const email = match[3].trim();
    if (displayName && needsMimeEncoding(displayName)) {
      return `${encodeMimeWord(displayName)} <${email}>`;
    }
    if (displayName) {
      return `"${displayName.replace(/"/g, '\\"')}" <${email}>`;
    }
    return email;
  }

  return encodeHeader(raw);
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage({ from, to, subject, text, html }) {
  const boundary = `bu-hub-${Date.now().toString(36)}`;
  return [
    `From: ${formatAddressHeader(from)}`,
    `To: ${formatAddressHeader(to)}`,
    `Subject: ${encodeMimeWord(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

async function sendViaGmailApi({ from, to, subject, text, html }) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = encodeBase64Url(buildMimeMessage({ from, to, subject, text, html }));

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

async function getTransporter() {
  if (transporter) return transporter;
  if (!isMailConfigured()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = resolveSecure(port);
  const requireTLS = resolveRequireTls(port, secure);
  const smtpHost = process.env.SMTP_HOST;
  const resolvedHost = await resolveSmtpHost(smtpHost);

  transporter = nodemailer.createTransport({
    host: resolvedHost,
    port,
    secure,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    auth: {
      user: process.env.SMTP_USER,
      pass: normalizeSmtpPass(process.env.SMTP_PASS),
    },
    tls: {
      minVersion: 'TLSv1.2',
      servername: smtpHost,
    },
    ...(requireTLS && { requireTLS: true }),
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

  if (isGmailApiConfigured()) {
    try {
      await sendViaGmailApi({ from, to, subject, text, html });
      return { dev: false, provider: 'gmail-api' };
    } catch (err) {
      console.error('[Gmail API error]', err.message);
      const wrapped = new Error(
        'Gmail API 이메일 발송에 실패했습니다. Google OAuth 환경 변수와 Gmail API 사용 설정을 확인해 주세요.',
      );
      wrapped.status = 502;
      throw wrapped;
    }
  }

  const transport = await getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV mail] To: ${to} | Code: ${code}`);
      return { dev: true, provider: 'dev-console' };
    }
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
        'SMTP 서버 연결 시간 초과입니다. Render 무료 서비스는 Gmail/Naver SMTP 포트 '
        + '25/465/587 아웃바운드를 차단합니다. SMTP를 계속 쓰려면 SendGrid/Mailgun/SMTP2GO '
        + '같은 SMTP 릴레이를 2525 포트로 설정해 주세요.';
    }
    if (smtpErr.includes('ENETUNREACH')) {
      message =
        'SMTP 서버에 연결할 수 없습니다(IPv6 네트워크 오류). '
        + '서버를 재배포한 뒤 다시 시도해 주세요.';
    }

    const wrapped = new Error(message);
    wrapped.status = 502;
    throw wrapped;
  }
}

module.exports = {
  sendVerificationEmail,
  isMailConfigured,
  isGmailApiConfigured,
  resolveFromAddress,
  formatAddressHeader,
  encodeMimeWord,
  resolveSecure,
  resolveRequireTls,
  getTransporter,
};
