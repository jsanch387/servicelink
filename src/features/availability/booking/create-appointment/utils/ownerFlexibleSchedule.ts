import type { DayKey, WeeklySchedule } from '@/features/availability/types/availability';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/** Default window when a closed day has no saved hours. */
const FALLBACK_HOURS = { start: '09:00', end: '17:00' };

/**
 * Owner create-appointment: keep configured hours on open days, and still
 * offer a day window on closed days so they can squeeze a visit in.
 * Does not invent earlier/later hours than the owner configured.
 */
export function buildOwnerFlexibleWeeklySchedule(
  weekly: WeeklySchedule
): WeeklySchedule {
  const out = { ...weekly };
  for (const key of DAY_KEYS) {
    const day = weekly[key];
    if (day?.enabled) {
      out[key] = {
        enabled: true,
        start: day.start || FALLBACK_HOURS.start,
        end: day.end || FALLBACK_HOURS.end,
      };
      continue;
    }
    out[key] = {
      enabled: true,
      start: day?.start?.trim() ? day.start : FALLBACK_HOURS.start,
      end: day?.end?.trim() ? day.end : FALLBACK_HOURS.end,
    };
  }
  return out;
}
