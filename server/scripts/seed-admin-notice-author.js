require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { getServerClient } = require('../src/config/supabase');

const ADMIN_STUDENT_ID = 'test';
const ADMIN_PASSWORD = '12341234';
const ADMIN_NAME = '관리자';
const DEPT_NAME = '컴퓨터공학부';

/** 커뮤니티(멘토링·팀프로젝트) 제외 — 장학·대회·학과 */
const NOTICE_BOARD_IDS = [1, 2, 5];

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
    .select('id, student_id, name')
    .eq('student_id', ADMIN_STUDENT_ID)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ password: passwordHash, name: ADMIN_NAME, department_id: departmentId })
      .eq('id', existing.id)
      .select('id, student_id, name')
      .single();

    if (error) throw new Error(`admin update: ${error.message}`);
    console.log('Updated admin user:', updated);
    return updated.id;
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({
      department_id: departmentId,
      student_id: ADMIN_STUDENT_ID,
      password: passwordHash,
      name: ADMIN_NAME,
    })
    .select('id, student_id, name')
    .single();

  if (error) throw new Error(`admin insert: ${error.message}`);
  console.log('Created admin user:', created);
  return created.id;
}

async function reassignNoticeAuthors(supabase, adminUserId) {
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, board_id, user_id')
    .in('board_id', NOTICE_BOARD_IDS);

  if (fetchError) throw new Error(`posts fetch: ${fetchError.message}`);

  const toUpdate = (posts ?? []).filter((post) => post.user_id !== adminUserId);
  if (toUpdate.length === 0) {
    console.log('All notice-board posts already authored by admin.');
    return;
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ user_id: adminUserId })
    .in(
      'id',
      toUpdate.map((post) => post.id),
    );

  if (updateError) throw new Error(`posts update: ${updateError.message}`);

  console.log(`Reassigned ${toUpdate.length} posts to admin (user_id=${adminUserId}):`);
  toUpdate.forEach((post) => {
    console.log(`  - [board ${post.board_id}] ${post.title}`);
  });
}

async function run() {
  const supabase = getServerClient();
  const departmentId = await ensureDepartment(supabase);
  const adminUserId = await ensureAdminUser(supabase, departmentId);
  await reassignNoticeAuthors(supabase, adminUserId);
  console.log('\nAdmin login: ID = test / PW = 12341234');
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
