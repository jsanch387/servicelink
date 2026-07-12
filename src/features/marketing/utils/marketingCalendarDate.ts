/**
 * Marketing sale/promo windows are stored as UTC calendar-day bounds
 * (`YYYY-MM-DDT00:00:00.000Z` / `…T23:59:59.999Z`). Always read/format the
 * UTC date parts so US local timezones do not shift the shown day backward.
 */

export function marketingCalendarYmd(
  value: Date | string | null | undefined
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function formatMarketingCalendarDate(
  value: Date | string | null | undefined,
  locale: string = 'en-US'
): string {
  const ymd = marketingCalendarYmd(value);
  if (!ymd) return '';
  const [year, month, day] = ymd.split('-').map(Number);
  // Noon UTC avoids any DST edge when formatting a calendar day.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Compare "today" to a stored window using UTC calendar days (inclusive). */
export function compareMarketingCalendarDayToWindow(
  now: Date,
  startsAt: Date | string | null | undefined,
  endsAt: Date | string | null | undefined
): 'before' | 'inside' | 'after' | 'open' {
  const start = marketingCalendarYmd(startsAt);
  const end = marketingCalendarYmd(endsAt);
  if (!start && !end) return 'open';

  const today = marketingCalendarYmd(now);
  if (!today) return 'open';

  if (start && today < start) return 'before';
  if (end && today > end) return 'after';
  return 'inside';
}
