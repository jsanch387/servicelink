import { addDaysToDateKey, localDateKey } from '../dayPlannerUtils';

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`);
}

/** Sunday-start week (US shop calendar). */
export function startOfWeekKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return addDaysToDateKey(dateKey, -date.getDay());
}

export function weekKeys(dateKey: string): string[] {
  const start = startOfWeekKey(dateKey);
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateKey(start, index)
  );
}

export function addMonthsToDateKey(
  dateKey: string,
  deltaMonths: number
): string {
  const date = parseDateKey(dateKey);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + deltaMonths);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  date.setDate(Math.min(day, lastDay));
  return localDateKey(date);
}

export function startOfMonthKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return localDateKey(date);
}

/** Six Sunday-start weeks covering the month (leading/trailing days included). */
export function monthGridKeys(dateKey: string): string[] {
  const monthStart = startOfMonthKey(dateKey);
  const gridStart = startOfWeekKey(monthStart);
  return Array.from({ length: 42 }, (_, index) =>
    addDaysToDateKey(gridStart, index)
  );
}

export function isSameMonth(dateKey: string, monthKey: string): boolean {
  return dateKey.slice(0, 7) === monthKey.slice(0, 7);
}

export function isCursorOnToday(
  dateKey: string,
  range: 'day' | 'week' | 'month',
  todayKey: string
): boolean {
  if (range === 'day') return dateKey === todayKey;
  if (range === 'week') return weekKeys(dateKey).includes(todayKey);
  return isSameMonth(dateKey, todayKey);
}

export function formatMonthTitle(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekTitle(dateKey: string, compact = false): string {
  const keys = weekKeys(dateKey);
  const start = parseDateKey(keys[0] ?? dateKey);
  const end = parseDateKey(keys[6] ?? dateKey);
  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  if (compact) {
    const endLabel =
      start.getMonth() === end.getMonth()
        ? String(end.getDate())
        : end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
    return `${startLabel} – ${endLabel}`;
  }
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatDayTitle(dateKey: string, compact = false): string {
  return parseDateKey(dateKey).toLocaleDateString(
    'en-US',
    compact
      ? { weekday: 'short', month: 'short', day: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric' }
  );
}

export function weekdayShort(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

export function dayNumber(dateKey: string): string {
  return String(parseDateKey(dateKey).getDate());
}

export function hhmmToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return Math.max(0, (hours ?? 0) * 60 + (minutes ?? 0));
}

export function formatMinutesLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: minutes === 0 ? undefined : '2-digit',
      hour12: true,
    })
    .replace(/\s+/g, '\u00A0');
}
