export interface BookingListCursor {
  scheduledDate: string;
  startTime: string;
  id: string;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_VALUE = /^\d{2}:\d{2}(?::\d{2})?$/;
const ID_VALUE = /^[0-9a-f-]{8,}$/i;

export function encodeBookingListCursor(cursor: BookingListCursor): string {
  return `${cursor.scheduledDate}|${cursor.startTime}|${cursor.id}`;
}

export function parseBookingListCursor(raw: string): BookingListCursor | null {
  const parts = raw.split('|');
  if (parts.length !== 3) return null;
  const [scheduledDate, startTime, id] = parts;
  if (
    !scheduledDate ||
    !startTime ||
    !id ||
    !DATE_KEY.test(scheduledDate) ||
    !TIME_VALUE.test(startTime) ||
    !ID_VALUE.test(id)
  ) {
    return null;
  }
  return { scheduledDate, startTime, id };
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

/** Keyset: rows beyond this cursor in the page sort direction. */
export function bookingListKeysetOr(
  cursor: BookingListCursor,
  direction: 'asc' | 'desc' = 'desc'
): string {
  const cmp = direction === 'asc' ? 'gt' : 'lt';
  const date = cursor.scheduledDate;
  const time = quotePostgrestValue(cursor.startTime);
  const id = quotePostgrestValue(cursor.id);
  return [
    `scheduled_date.${cmp}.${date}`,
    `and(scheduled_date.eq.${date},start_time.${cmp}.${time})`,
    `and(scheduled_date.eq.${date},start_time.eq.${time},id.${cmp}.${id})`,
  ].join(',');
}

export function cursorFromBookingRow(row: {
  id: string;
  scheduled_date: string;
  start_time: string;
}): BookingListCursor {
  return {
    scheduledDate: row.scheduled_date,
    startTime: row.start_time,
    id: row.id,
  };
}
