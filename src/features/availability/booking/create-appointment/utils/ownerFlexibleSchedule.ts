import type { DayKey, WeeklySchedule } from '@/features/availability/types/availability';
import { parseTimeHHmm } from '@/features/availability/booking/utils/slotGeneration';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/** Default open-day hours when a closed day has no saved window. */
const FALLBACK_HOURS = { start: '09:00', end: '17:00' };

/** Wider owner window when the visit does not fit the configured day. */
const OWNER_WIDE_HOURS = { start: '06:00', end: '22:00' };

function toHHmm(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Owner create-appointment calendar: keep configured hours on open days,
 * still offer a day window on closed days, and widen the window when the
 * visit duration would otherwise produce zero slots.
 */
export function buildOwnerFlexibleWeeklySchedule(
  weekly: WeeklySchedule,
  options?: { minWindowMinutes?: number }
): WeeklySchedule {
  const minWindow = Math.max(30, options?.minWindowMinutes ?? 30);
  const out = { ...weekly };

  for (const key of DAY_KEYS) {
    const day = weekly[key];
    let start = day?.enabled
      ? day.start || FALLBACK_HOURS.start
      : day?.start?.trim()
        ? day.start
        : FALLBACK_HOURS.start;
    let end = day?.enabled
      ? day.end || FALLBACK_HOURS.end
      : day?.end?.trim()
        ? day.end
        : FALLBACK_HOURS.end;

    let startMins = parseTimeHHmm(start);
    let endMins = parseTimeHHmm(end);
    if (!(endMins > startMins) || endMins - startMins < minWindow) {
      start = OWNER_WIDE_HOURS.start;
      end = OWNER_WIDE_HOURS.end;
      startMins = parseTimeHHmm(start);
      endMins = parseTimeHHmm(end);
    }
    if (endMins - startMins < minWindow) {
      // Extremely long visit: stretch end past midnight cap as far as possible.
      end = toHHmm(Math.min(24 * 60, startMins + minWindow));
    }

    out[key] = { enabled: true, start, end };
  }

  return out;
}
