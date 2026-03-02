/**
 * Format duration in minutes for display (used in service list).
 * Whole hours or 30 min increments.
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours % 1 === 0) return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  return `${hours} hrs`;
}
