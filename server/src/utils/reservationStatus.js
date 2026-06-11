const APPROVED_DB_STATUSES = new Set(['APPROVED', 'CONFIRMED']);
const REJECTED_DB_STATUSES = new Set(['REJECTED', 'DENIED']);

function normalizeReservationStatus(dbStatus) {
  const upper = String(dbStatus ?? 'PENDING').toUpperCase();
  if (REJECTED_DB_STATUSES.has(upper)) return 'rejected';
  if (APPROVED_DB_STATUSES.has(upper)) return 'approved';
  return 'pending';
}

function pickRejectReason(row) {
  if (!row || typeof row !== 'object') return null;
  const value = row.n_reason ?? row.N_reason ?? null;
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

module.exports = {
  APPROVED_DB_STATUSES,
  REJECTED_DB_STATUSES,
  normalizeReservationStatus,
  pickRejectReason,
};
