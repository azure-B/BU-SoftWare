const { TOUR_VERIFY_INTERVAL_DAYS } = require('../src/utils/tourConstants');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isVerificationDue(lastVerifiedAt) {
  if (!lastVerifiedAt) return true;
  const elapsedMs = Date.now() - new Date(lastVerifiedAt).getTime();
  return elapsedMs >= TOUR_VERIFY_INTERVAL_DAYS * MS_PER_DAY;
}

describe('tour maintenance schedule', () => {
  test('treats missing verification timestamp as due', () => {
    expect(isVerificationDue(null)).toBe(true);
    expect(isVerificationDue(undefined)).toBe(true);
  });

  test('waits until 30 days have passed', () => {
    const recent = new Date(Date.now() - (TOUR_VERIFY_INTERVAL_DAYS - 1) * MS_PER_DAY).toISOString();
    const old = new Date(Date.now() - (TOUR_VERIFY_INTERVAL_DAYS + 1) * MS_PER_DAY).toISOString();

    expect(isVerificationDue(recent)).toBe(false);
    expect(isVerificationDue(old)).toBe(true);
  });
});
