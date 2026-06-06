require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { getServerClient } = require('../src/config/supabase');

async function run() {
  const supabase = getServerClient();
  const passwordHash = bcrypt.hashSync('password123', 10);

  const { data: existingDept } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', '컴퓨터공학과')
    .maybeSingle();

  let departmentId = existingDept?.id;

  if (!departmentId) {
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .insert({ name: '컴퓨터공학과' })
      .select('id')
      .single();

    if (deptError) {
      console.error('department insert failed:', deptError.message);
      process.exit(1);
    }
    departmentId = dept.id;
    console.log('Created department id=', departmentId);
  } else {
    console.log('Department exists id=', departmentId);
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, student_id')
    .eq('student_id', '20240001')
    .maybeSingle();

  if (existingUser) {
    console.log('User already exists:', existingUser.student_id);
    return;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      department_id: departmentId,
      student_id: '20240001',
      password: passwordHash,
      name: '김백석',
    })
    .select('id, student_id, name')
    .single();

  if (userError) {
    console.error('user insert failed:', userError.message);
    process.exit(1);
  }

  console.log('Created user:', user);
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
