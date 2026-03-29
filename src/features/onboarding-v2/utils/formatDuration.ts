/**
 * Format duration in minutes for display (used in service list).
 * Whole hours or 30 min increments.
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ${h === 1 ? 'hr' : 'hrs'}`;
  return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m} min`;
}
