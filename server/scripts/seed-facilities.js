require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { execSync } = require('child_process');
const { getServerClient } = require('../src/config/supabase');
const {
  GLOBAL_FACILITY_TEMPLATES,
  buildDepartmentFacilityTemplates,
} = require('../src/utils/facilityCatalog');

async function ensureSchema() {
  try {
    execSync('node scripts/apply-migrate-facilities.js', {
      cwd: require('path').join(__dirname, '..'),
      stdio: 'inherit',
    });
  } catch {
    console.warn(
      'DDL 자동 적용 실패 — Supabase SQL Editor에서 scripts/seed-facilities-full.sql 을 실행하세요.',
    );
  }
}

async function assertFacilitySchema(supabase) {
  const { error } = await supabase.from('facilities').select('slug').limit(1);
  if (error?.message?.includes('slug')) {
    throw new Error(
      'facilities.slug 컬럼이 없습니다.\n' +
        'Supabase SQL Editor에서 server/scripts/seed-facilities-full.sql 을 실행한 뒤 다시 시도하세요.',
    );
  }
}

async function upsertFacility(supabase, row) {
  const payload = {
    name: row.name,
    location: row.location,
    category: row.category,
    department_id: row.department_id ?? null,
    slug: row.slug,
    description: row.description ?? '',
    max_participants: row.max_participants ?? 10,
    is_available: row.is_available !== false,
    amenities: row.amenities ?? [],
  };

  const { data: existing, error: fetchError } = await supabase
    .from('facilities')
    .select('id, slug')
    .eq('slug', row.slug)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`facilities fetch (${row.slug}): ${fetchError.message}`);
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('facilities')
      .update(payload)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`facilities update (${row.slug}): ${updateError.message}`);
    }
    return { id: existing.id, slug: row.slug, updated: true };
  }

  const { data, error: insertError } = await supabase
    .from('facilities')
    .insert(payload)
    .select('id, slug')
    .single();

  if (insertError) {
    throw new Error(`facilities insert (${row.slug}): ${insertError.message}`);
  }

  return { id: data.id, slug: data.slug, updated: false };
}

async function run() {
  await ensureSchema();

  const supabase = getServerClient();
  await assertFacilitySchema(supabase);

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .order('id', { ascending: true });

  if (deptError) {
    throw new Error(`departments 조회 실패: ${deptError.message}`);
  }

  if (!departments?.length) {
    throw new Error('departments 테이블이 비어 있습니다. npm run seed:departments 를 먼저 실행하세요.');
  }

  const rows = [];

  for (const [category, templates] of Object.entries(GLOBAL_FACILITY_TEMPLATES)) {
    for (const template of templates) {
      rows.push({
        ...template,
        category,
        department_id: null,
      });
    }
  }

  for (const department of departments) {
    for (const template of buildDepartmentFacilityTemplates(department)) {
      rows.push({
        ...template,
        category: 'dept',
        department_id: department.id,
      });
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const result = await upsertFacility(supabase, row);
    if (result.updated) updated += 1;
    else inserted += 1;
  }

  console.log(`Facilities seeded: ${inserted} inserted, ${updated} updated (${rows.length} total)`);
  console.log(`  - Global: startup/student/futsal`);
  console.log(`  - Department: ${departments.length} departments × 2 facilities`);
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
