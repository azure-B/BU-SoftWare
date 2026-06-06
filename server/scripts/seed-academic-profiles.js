require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getServerClient } = require('../src/config/supabase');
const AcademicModel = require('../src/models/academicModel');

async function run() {
  const supabase = getServerClient();
  const { data: users, error } = await supabase.from('users').select('id, student_id, name').order('id');

  if (error) {
    throw new Error(`users 조회 실패: ${error.message}`);
  }

  if (!users?.length) {
    console.log('등록된 사용자가 없습니다.');
    return;
  }

  let seeded = 0;

  for (const user of users) {
    const result = await AcademicModel.createDefaultProfile(user.id);
    if (result.graduationSeeded || result.enrollmentsSeeded > 0) {
      seeded += 1;
      console.log(
        `  - user ${user.id} (${user.student_id}, ${user.name}): graduation=${result.graduationSeeded}, enrollments=${result.enrollmentsSeeded}`,
      );
    }
  }

  if (seeded === 0) {
    console.log('모든 사용자에 학점 프로필이 이미 있습니다.');
  } else {
    console.log(`Seeded academic profile for ${seeded} user(s).`);
  }
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
