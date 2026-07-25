/**
 * Compact time-off date labels for list + add modal.
 * Same month: "Jul 27 – 31". Different months: "Jul 27 – Aug 2".
 * No weekday; year only when the range spans years.
 */

function parseIsoLocal(iso: string): Date | null {
  const [y, mo, d] = iso.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

function monthShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short' });
}

/**
 * Formats an inclusive YYYY-MM-DD range for time-off UI.
 */
export function formatTimeOffDateRange(
  startDate: string,
  endDate: string
): string {
  const start = parseIsoLocal(startDate);
  const end = parseIsoLocal(endDate) ?? start;
  if (!start) return startDate;

  const sameDay =
    start.getFullYear() === end!.getFullYear() &&
    start.getMonth() === end!.getMonth() &&
    start.getDate() === end!.getDate();

  if (sameDay) {
    return `${monthShort(start)} ${start.getDate()}`;
  }

  const sameYear = start.getFullYear() === end!.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end!.getMonth();

  if (sameMonth) {
    return `${monthShort(start)} ${start.getDate()} – ${end!.getDate()}`;
  }

  if (sameYear) {
    return `${monthShort(start)} ${start.getDate()} – ${monthShort(end!)} ${end!.getDate()}`;
  }

  return `${monthShort(start)} ${start.getDate()}, ${start.getFullYear()} – ${monthShort(end!)} ${end!.getDate()}, ${end!.getFullYear()}`;
}
