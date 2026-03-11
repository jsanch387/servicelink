import type { BusinessAvailabilityRow } from '../types/availability';

/**
 * True when the business has saved a weekly schedule with at least one day enabled.
 * Used to decide: if they've set availability and then turn "Accept Bookings" off,
 * we do NOT fall back to legacy request booking (show "not accepting" instead).
 */
export function hasAvailabilityConfigured(
  row: BusinessAvailabilityRow | null
): boolean {
  if (!row?.weekly_schedule || typeof row.weekly_schedule !== 'object') {
    return false;
  }
  const schedule = row.weekly_schedule as Record<string, { enabled?: boolean }>;
  return Object.values(schedule).some(day => day?.enabled === true);
}
