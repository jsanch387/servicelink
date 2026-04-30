/**
 * Sentinel stored when `anchor_date` / `anchor_time` are NOT NULL in the DB but no
 * real first visit is set yet (legacy NOT NULL columns). Do not show as a real date.
 */
export const MAINTENANCE_ANCHOR_PLACEHOLDER_DATE = '2099-12-31';
export const MAINTENANCE_ANCHOR_PLACEHOLDER_TIME = '00:00';

export function isMaintenanceAnchorPlaceholder(row: {
  anchor_date?: string | null;
  anchor_time?: string | null;
}): boolean {
  const d = String(row.anchor_date ?? '').trim();
  const t = String(row.anchor_time ?? '')
    .trim()
    .slice(0, 5);
  return (
    d === MAINTENANCE_ANCHOR_PLACEHOLDER_DATE &&
    t === MAINTENANCE_ANCHOR_PLACEHOLDER_TIME
  );
}

/**
 * True when the enrollment has a concrete first-visit date and time the owner
 * or customer already set (YYYY-MM-DD + HH:mm), excluding the DB placeholder.
 */
export function hasMaintenanceAnchorScheduled(row: {
  anchor_date?: string | null;
  anchor_time?: string | null;
}): boolean {
  if (isMaintenanceAnchorPlaceholder(row)) return false;
  const d = String(row.anchor_date ?? '').trim();
  const t = String(row.anchor_time ?? '')
    .trim()
    .slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return false;
  return true;
}
