require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');

async function run() {
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('Key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'publishable');

  const supabase = getServerClient();

  const { data: depts, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .limit(3);

  console.log('\n[departments]', deptError ? `ERROR: ${deptError.message}` : depts);

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, student_id, name, department_id')
    .limit(3);

  console.log('[users]', userError ? `ERROR: ${userError.message}` : users);

  if (userError) {
    process.exitCode = 1;
    return;
  }

  const testId = '20240001';
  const { data: loginUser, error: loginError } = await supabase
    .from('users')
    .select('id, student_id, password, name, department_id, departments(name)')
    .eq('student_id', testId)
    .maybeSingle();

  console.log(`\n[login lookup student_id=${testId}]`,
    loginError ? `ERROR: ${loginError.message}` : loginUser ? 'OK (user found)' : 'OK (no row)');

  process.exit(process.exitCode || 0);
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
