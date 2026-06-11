require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { getServerClient } = require('../src/config/supabase');
const { ADMIN_STUDENT_ID } = require('../src/constants/adminAccount');

const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = '관리자';
const ADMIN_ROLE = 'SUPER_ADMIN';
const DEPT_NAME = '컴퓨터공학부';

async function ensureDepartment(supabase) {
  const { data: existing } = await supabase
    .from('departments')
    .select('id')
    .eq('name', DEPT_NAME)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from('departments')
    .insert({ name: DEPT_NAME })
    .select('id')
    .single();

  if (error) throw new Error(`department insert: ${error.message}`);
  return data.id;
}

async function ensureAdminUser(supabase, departmentId) {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  const { data: existing } = await supabase
    .from('users')
    .select('id, student_id, name, password')
    .eq('student_id', ADMIN_STUDENT_ID)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ password: passwordHash, name: ADMIN_NAME, department_id: departmentId })
      .eq('id', existing.id)
      .select('id, student_id, name, password')
      .single();

    if (error) throw new Error(`admin user update: ${error.message}`);
    console.log('Updated admin user:', { id: updated.id, student_id: updated.student_id, name: updated.name });
    return updated;
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({
      department_id: departmentId,
      student_id: ADMIN_STUDENT_ID,
      password: passwordHash,
      name: ADMIN_NAME,
    })
    .select('id, student_id, name, password')
    .single();

  if (error) throw new Error(`admin user insert: ${error.message}`);
  console.log('Created admin user:', { id: created.id, student_id: created.student_id, name: created.name });
  return created;
}

async function ensureAdminRecord(supabase, userId) {
  const { data: existing, error: fetchError } = await supabase
    .from('admins')
    .select('id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `admins table lookup failed: ${fetchError.message}\n` +
        'Supabase SQL Editor에서 server/scripts/migrate-admins.sql 을 먼저 실행해 주세요.',
    );
  }

  if (existing?.id) {
    const { data: updated, error } = await supabase
      .from('admins')
      .update({ role: ADMIN_ROLE, facility_id: null })
      .eq('id', existing.id)
      .select('id, role')
      .single();

    if (error) throw new Error(`admins update: ${error.message}`);
    console.log('Updated admins row:', updated);
    return;
  }

  const { data: created, error } = await supabase
    .from('admins')
    .insert({
      user_id: userId,
      facility_id: null,
      role: ADMIN_ROLE,
    })
    .select('id, role')
    .single();

  if (error) {
    throw new Error(
      `admins insert: ${error.message}\n` +
        'Supabase SQL Editor에서 server/scripts/migrate-admins.sql 을 먼저 실행해 주세요.',
    );
  }

  console.log('Created admins row:', created);
}

async function verifyLogin(userRow) {
  const ok = bcrypt.compareSync(ADMIN_PASSWORD, userRow.password);
  if (!ok) {
    throw new Error('비밀번호 해시 검증에 실패했습니다.');
  }
  console.log('Password verify: OK');
}

async function run() {
  const supabase = getServerClient();
  const departmentId = await ensureDepartment(supabase);
  const userRow = await ensureAdminUser(supabase, departmentId);
  await ensureAdminRecord(supabase, userRow.id);
  await verifyLogin(userRow);

  console.log('\n=== Admin account ready ===');
  console.log(`Login ID : ${ADMIN_STUDENT_ID}`);
  console.log(`Password : ${ADMIN_PASSWORD}`);
  console.log('로그인 시 관리자 화면으로 이동합니다.');
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
