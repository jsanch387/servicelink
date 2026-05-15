/**
 * Booking list card: compact 12h label from `startTimeHHmm` (`HH:mm`), e.g. `9:00 AM`.
 */

export type ListCardTimeFields = {
  startTimeHHmm: string;
  /** Human time from API/mapper when HH:mm is missing or invalid. */
  time: string;
};

export function formatListCardTimeForBooking(
  booking: ListCardTimeFields
): string {
  const raw = booking.startTimeHHmm?.trim();
  if (!raw || !/^\d{1,2}:\d{2}$/.test(raw)) {
    return (booking.time ?? '').trim() || '—';
  }
  const [hs, ms] = raw.split(':');
  const h24 = Math.min(23, Math.max(0, parseInt(hs, 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(ms, 10) || 0));
  const mm = String(m).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${h12}:${mm} ${ampm}`;
}
