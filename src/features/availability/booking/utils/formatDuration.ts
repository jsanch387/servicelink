/**
 * Format duration in minutes for display (hours when ≥ 60, otherwise minutes).
 * Storage stays in minutes; this is for UI only.
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) {
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  }
  const hours = minutes / 60;
  if (hours % 1 === 0) {
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }
  return `${hours} hrs`;
}
