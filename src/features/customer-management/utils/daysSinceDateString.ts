const DAY_MS = 1000 * 60 * 60 * 24;

/** Days between a calendar date (YYYY-MM-DD) and today in local time. */
export function daysSinceDateString(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) {
    return 0;
  }
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const ms = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / DAY_MS));
}

/** Whole calendar days from today until `isoDate` (local midnight). */
export function daysUntilDateString(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) {
    return 0;
  }
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.max(0, Math.floor(ms / DAY_MS));
}
