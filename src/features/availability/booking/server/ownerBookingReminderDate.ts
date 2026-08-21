/**
 * Day-before owner reminders use a single US timezone so “tomorrow” is stable
 * across cron runs. Bookings themselves store floating local wall dates.
 */
export const OWNER_BOOKING_REMINDER_TIMEZONE = 'America/Chicago';

/** `YYYY-MM-DD` for `now` in `timeZone`. */
export function calendarDateInTimeZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Add whole calendar days to a `YYYY-MM-DD` value (UTC date arithmetic). */
export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days);
  return new Date(utc).toISOString().slice(0, 10);
}

/** Confirmed bookings on this date get the day-before reminder. */
export function ownerBookingReminderTargetDate(
  now: Date,
  timeZone: string = OWNER_BOOKING_REMINDER_TIMEZONE
): string {
  return addCalendarDays(calendarDateInTimeZone(now, timeZone), 1);
}
