const TourModel = require('../models/tourModel');

const DAILY_CHECK_MS = 24 * 60 * 60 * 1000;

let dailyTimer = null;
let running = false;

function isEnabled() {
  const flag = process.env.TOUR_MAINTENANCE_ENABLED;
  return flag == null || flag === '' || flag === '1' || flag === 'true';
}

async function runTourMaintenance({ force = false } = {}) {
  if (!isEnabled()) {
    return { skipped: true, reason: 'disabled' };
  }

  if (!force) {
    const due = await TourModel.shouldRunMonthlyVerification();
    if (!due) {
      return { skipped: true, reason: 'not_due' };
    }
  }

  const result = await TourModel.verifyAndPruneRestaurants({ force });
  console.log(
    `[tour-maintenance] verified=${result.verified} removed=${result.removed} skipped=${result.skipped} synced=${result.updatedPlaces ?? 0}`,
  );
  return result;
}

async function runTourMaintenanceSafely(options = {}) {
  if (running) return { skipped: true, reason: 'already_running' };
  running = true;
  try {
    return await runTourMaintenance(options);
  } catch (err) {
    console.error('[tour-maintenance]', err.message);
    return { skipped: true, reason: 'error', error: err.message };
  } finally {
    running = false;
  }
}

function startTourMaintenanceJob() {
  if (!isEnabled()) return;

  if (dailyTimer) {
    clearInterval(dailyTimer);
    dailyTimer = null;
  }

  runTourMaintenanceSafely({ force: false });

  dailyTimer = setInterval(() => {
    runTourMaintenanceSafely({ force: false });
  }, DAILY_CHECK_MS);

  const nextRun = new Date(Date.now() + DAILY_CHECK_MS);
  console.log(`[tour-maintenance] daily check enabled · next at ${nextRun.toISOString()}`);
}

module.exports = {
  startTourMaintenanceJob,
  runTourMaintenance,
  runTourMaintenanceSafely,
};
