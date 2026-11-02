/** Offset of `timeZone` at `instant`: local wall clock minus UTC, in ms. */
export function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const value: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') value[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second)
  );
  // Intl parts are second-precision; ignore ms so 23:59:59.999 stays on that day.
  const instantSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return asUtc - instantSeconds;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function zonedYmd(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function zonedYearMonth(instant: Date, timeZone: string): string {
  return zonedYmd(instant, timeZone).slice(0, 7);
}

/** Convert a wall-clock date in `timeZone` to a UTC Date. */
export function zonedWallTimeToUtc(
  ymd: string,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
  timeZone: string
): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  const wallAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds,
    milliseconds
  );
  let offset = timeZoneOffsetMs(new Date(wallAsUtc), timeZone);
  let instant = wallAsUtc - offset;
  offset = timeZoneOffsetMs(new Date(instant), timeZone);
  instant = wallAsUtc - offset;
  return new Date(instant);
}

export function zonedDayStartUtc(ymd: string, timeZone: string): Date {
  return zonedWallTimeToUtc(ymd, 0, 0, 0, 0, timeZone);
}

export function zonedDayEndUtc(ymd: string, timeZone: string): Date {
  return zonedWallTimeToUtc(ymd, 23, 59, 59, 999, timeZone);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Same month/day in another year. Feb 29 → Feb 28 when the target year is not a leap year. */
export function ymdWithYear(ymd: string, year: number): string {
  const month = ymd.slice(5, 7);
  const day = ymd.slice(8, 10);
  if (month === '02' && day === '29' && !isLeapYear(year)) {
    return `${year}-02-28`;
  }
  return `${year}-${month}-${day}`;
}

export function shiftYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, '0');
  const d = String(next.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function firstYmdOfMonth(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

export function lastYmdOfMonth(ymd: string): string {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shiftCalendarMonth(ymd: string, months: number): string {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const next = new Date(Date.UTC(year, month - 1 + months, 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/** Monday of the calendar week that contains `ymd` (Mon–Sun weeks). */
export function mondayOfContainingWeek(ymd: string): string {
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  return shiftYmd(ymd, -back);
}

export function daysInclusive(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T00:00:00Z`);
  const to = Date.parse(`${toYmd}T00:00:00Z`);
  return Math.floor((to - from) / 86_400_000) + 1;
}

export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
