/** Local calendar-day helpers shared by the bookings list and calendar. */

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

/** YYYY-MM-DD → "Mar 25" */
export function formatDayGroupLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

