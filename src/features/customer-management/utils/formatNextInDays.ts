export function formatNextInDays(daysUntil: number): string {
  if (daysUntil <= 0) {
    return 'Today';
  }
  if (daysUntil === 1) {
    return 'in 1 day';
  }
  return `in ${daysUntil} days`;
}
