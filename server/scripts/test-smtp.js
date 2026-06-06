require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getTransporter, resolveFromAddress, resolveSecure } = require('../src/config/mailer');

async function run() {
  const port = Number(process.env.SMTP_PORT || 587);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', port, '| secure:', resolveSecure(port));
  console.log('SMTP_FROM:', resolveFromAddress());

  const transport = await getTransporter();
  if (!transport) {
    console.error('SMTP not configured');
    process.exit(1);
  }

  try {
    await transport.verify();
    console.log('SMTP connection: OK');
  } catch (err) {
    console.error('SMTP connection: FAILED');
    console.error(err.message);
    process.exit(1);
  }
}

run();
