/**
 * Helpers for Day Planner (local day boundaries + 12h time strings from bookings).
 */

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() + deltaDays);
  return localDateKey(d);
}

export function isDateKeyToday(dateKey: string): boolean {
  return dateKey === localDateKey(new Date());
}

/** e.g. "Mar 22, Sunday" */
export function formatPlannerDayTitle(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  const monthDay = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${monthDay}, ${weekday}`;
}

/**
 * Parses display times from mapBookingRowToDisplay, e.g. "9:00 AM", "2 PM".
 * Returns minutes from midnight, or null if unrecognized.
 */
export function parseTimeToMinutesFromDisplay(timeStr: string): number | null {
  const normalized = timeStr.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = match[2] != null ? parseInt(match[2], 10) : 0;
  const ap = match[3];
  if (ap === 'PM' && hour !== 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export const DAY_PLANNER_DEFAULT_DURATION_MIN = 120;
