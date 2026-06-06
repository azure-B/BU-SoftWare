require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');

/** 백석대학교 학부 전체 (https://www.bu.ac.kr/web/4419/subview.do) */
const BAEKSEOK_DEPARTMENTS = [
  '기독교학부',
  '어문학부',
  '사회복지학부',
  '경찰학부',
  '경상학부',
  '관광학부',
  '사범학부',
  '컴퓨터공학부',
  '보건학부',
  '간호학과',
  '디자인영상학부',
  '스포츠과학부',
  '문화예술학부',
  '혁신교육플랫폼대학',
  '첨단IT학부',
  '외식산업학부',
  '자유전공학부',
  '국제학부',
];

async function ensureDepartment(supabase, name) {
  const { data: existing, error: fetchError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();

  if (fetchError) throw new Error(`departments fetch (${name}): ${fetchError.message}`);
  if (existing) return { ...existing, created: false };

  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) throw new Error(`departments insert (${name}): ${error.message}`);
  return { ...data, created: true };
}

async function run() {
  const supabase = getServerClient();
  const results = [];

  for (const name of BAEKSEOK_DEPARTMENTS) {
    const row = await ensureDepartment(supabase, name);
    results.push(row);
  }

  const created = results.filter((row) => row.created);
  const existing = results.filter((row) => !row.created);

  console.log(`Ensured ${results.length} official departments (${created.length} inserted, ${existing.length} already existed).`);
  if (created.length) {
    console.log('Inserted:', created.map((row) => `${row.id}:${row.name}`).join(', '));
  }

  const { data: all, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('id');

  if (error) throw new Error(`departments list: ${error.message}`);
  console.log('\nAll departments in DB:');
  for (const row of all) {
    console.log(`  ${row.id}\t${row.name}`);
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
