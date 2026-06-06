require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const {
  getResendClient,
  isResendConfigured,
  resolveResendFrom,
} = require('../src/config/mailer');

async function run() {
  if (!isResendConfigured()) {
    console.error('RESEND_API_KEY not configured');
    process.exit(1);
  }

  const to = process.argv[2];
  if (!to) {
    console.error('Usage: node scripts/test-resend.js recipient@example.com');
    process.exit(1);
  }

  console.log('RESEND_FROM:', resolveResendFrom());
  console.log('To:', to);

  const client = getResendClient();
  const { data, error } = await client.emails.send({
    from: resolveResendFrom(),
    to: [to],
    subject: '[백석 학생 허브] Resend 테스트',
    text: 'Resend 연동 테스트 메일입니다.',
  });

  if (error) {
    console.error('Resend send: FAILED');
    console.error(error.message || error);
    process.exit(1);
  }

  console.log('Resend send: OK', data?.id);
}

run();
