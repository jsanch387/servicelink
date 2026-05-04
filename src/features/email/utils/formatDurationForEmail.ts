/**
 * Human-readable duration for emails, e.g. 90 → "1 hr 30 min", 45 → "45 min".
 */
export function formatDurationForEmail(minutes: number): string {
  const m = Math.max(0, Math.round(Number(minutes)));
  if (m === 0) return '—';
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) {
    return rem === 1 ? '1 min' : `${rem} min`;
  }
  const hrPart = h === 1 ? '1 hr' : `${h} hrs`;
  if (rem === 0) return hrPart;
  return `${hrPart} ${rem} min`;
}
