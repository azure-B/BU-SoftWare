require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TourModel = require('../src/models/tourModel');

async function run() {
  const force = process.argv.includes('--force');
  const result = await TourModel.verifyAndPruneRestaurants({ force });
  console.log(
    `검증 완료 · 확인 ${result.verified} · 제거 ${result.removed} · 건너뜀 ${result.skipped} · 동기화 갱신 ${result.updatedPlaces ?? 0}`,
  );
  if (result.removed > 0) {
    console.log('폐업·범위 밖 음식점과 연결 게시판을 정리했습니다.');
  }
}

run()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
