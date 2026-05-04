/**
 * Human-facing service name for maintenance enrollments (CRM, emails, Stripe).
 * Avoids redundant strings like "Maintenance · Maintenance Detail".
 */

const GENERIC_SNAPSHOTS = new Set(['maintenance', 'maintenance detail', '']);

function cleanedSnapshot(snapshot: string | null | undefined): string {
  let t = String(snapshot ?? '').trim();
  if (!t) return '';
  t = t.replace(/^\s*maintenance\s*·\s*/i, '').trim();
  const lower = t.toLowerCase();
  if (GENERIC_SNAPSHOTS.has(lower)) return '';
  return t;
}

/** Raw snapshot after stripping legacy prefix and generic placeholders (calendar / storage comparisons). */
export function maintenanceServiceDisplayName(
  snapshot: string | null | undefined
): string {
  const inner = cleanedSnapshot(snapshot);
  return inner || 'Maintenance';
}

/**
 * Label shown to customers and owners (emails, CRM): generic plans read as "Maintenance plan".
 */
export function maintenancePlanServiceLabel(
  snapshot: string | null | undefined
): string {
  const inner = cleanedSnapshot(snapshot);
  if (!inner) return 'Maintenance plan';
  return inner;
}

/** Title stored on the first `bookings` row for a maintenance enrollment (calendar list). */
export function maintenanceCalendarBookingServiceTitle(
  snapshot: string | null | undefined
): string {
  const inner = cleanedSnapshot(snapshot);
  if (!inner) return 'Maintenance plan';
  return `${inner} (maintenance)`;
}
