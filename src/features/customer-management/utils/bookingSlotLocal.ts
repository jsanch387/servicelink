/** Sort key for booking slots: latest / earliest by local date + time. */
export function bookingSlotSortKey(
  scheduledDate: string,
  startTime: string
): string {
  const time = (startTime ?? '00:00:00').trim().slice(0, 8);
  return `${scheduledDate}T${time.padEnd(8, '0')}`;
}

export function bookingSlotLocalDate(
  scheduledDate: string,
  startTime: string
): Date {
  const t = (startTime ?? '00:00:00').trim().slice(0, 8);
  const [hh = '0', mm = '0', ss = '0'] = t.split(':');
  const [y, m, d] = scheduledDate.split('-').map(Number);
  return new Date(
    y || 1970,
    (m || 1) - 1,
    d || 1,
    Number(hh) || 0,
    Number(mm) || 0,
    Number(ss) || 0
  );
}

export function isBookingSlotAfterNow(
  scheduledDate: string,
  startTime: string,
  now: Date = new Date()
): boolean {
  return (
    bookingSlotLocalDate(scheduledDate, startTime).getTime() > now.getTime()
  );
}
