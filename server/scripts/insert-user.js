require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { getServerClient } = require('../src/config/supabase');

const STUDENT_ID = '20242644';
const PASSWORD = '1234';
const USER_NAME = '테스트학생';
const DEPT_NAME = '컴퓨터공학과';

async function ensureDepartment(supabase) {
  const { data: existing } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', DEPT_NAME)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('departments')
    .insert({ name: DEPT_NAME })
    .select('id')
    .single();

  if (error) throw new Error(`department insert: ${error.message}`);
  return data.id;
}

async function run() {
  const supabase = getServerClient();
  const departmentId = await ensureDepartment(supabase);

  const { data: existing } = await supabase
    .from('users')
    .select('id, student_id, name')
    .eq('student_id', STUDENT_ID)
    .maybeSingle();

  const passwordHash = bcrypt.hashSync(PASSWORD, 10);

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ password: passwordHash, name: USER_NAME })
      .eq('id', existing.id)
      .select('id, student_id, name, department_id')
      .single();

    if (updateError) throw new Error(`user update: ${updateError.message}`);
    console.log('Updated user password:', updated);
    return;
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      department_id: departmentId,
      student_id: STUDENT_ID,
      password: passwordHash,
      name: USER_NAME,
    })
    .select('id, student_id, name, department_id')
    .single();

  if (error) throw new Error(`user insert: ${error.message}`);
  console.log('Created user:', user);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
