import type { PublicBookingFlowLocale } from '@/constants/routes';

/**
 * Format duration in minutes for display (hours when ≥ 60, otherwise minutes).
 * Storage stays in minutes; this is for UI only.
 */
export function formatDurationMinutes(
  minutes: number,
  locale: PublicBookingFlowLocale = 'en'
): string {
  if (minutes <= 0) return locale === 'es' ? '0 min' : '0 min';
  if (minutes < 60) {
    if (locale === 'es') {
      return minutes === 1 ? '1 min' : `${minutes} min`;
    }
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === 'es') {
    if (m === 0) return h === 1 ? '1 h' : `${h} h`;
    return `${h} ${h === 1 ? 'h' : 'h'} ${m} min`;
  }
  if (m === 0) {
    return h === 1 ? '1 hr' : `${h} hrs`;
  }
  return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m} min`;
}
