import {
  BOOKINGS_LIST_DEFAULT_LIMIT,
  BOOKINGS_LIST_MAX_LIMIT,
  BOOKINGS_RANGE_MAX_DAYS,
} from '../constants';
import {
  parseBookingListCursor,
  type BookingListCursor,
} from '../utils/bookingListCursor';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const BOOKINGS_LIST_FILTERS = ['upcoming', 'past', 'cancelled'] as const;
export type BookingsListFilter = (typeof BOOKINGS_LIST_FILTERS)[number];

export type ListBookingsQuery =
  | {
      kind: 'page';
      limit: number;
      cursor?: BookingListCursor;
      filter: BookingsListFilter;
      asOf: string;
    }
  | {
      kind: 'range';
      from: string;
      to: string;
    };

export type ParseListBookingsQueryResult =
  | { ok: true; query: ListBookingsQuery }
  | { ok: false; error: string };

function inclusiveDaySpan(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function isBookingsListFilter(value: string): value is BookingsListFilter {
  return (BOOKINGS_LIST_FILTERS as readonly string[]).includes(value);
}

function defaultListAsOf(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function parseListBookingsQuery(
  searchParams: URLSearchParams
): ParseListBookingsQueryResult {
  const fromRaw = searchParams.get('from')?.trim() ?? '';
  const toRaw = searchParams.get('to')?.trim() ?? '';
  const cursorRaw = searchParams.get('cursor')?.trim() ?? '';
  const hasFrom = fromRaw.length > 0;
  const hasTo = toRaw.length > 0;

  if (hasFrom !== hasTo) {
    return { ok: false, error: 'from and to are required together.' };
  }

  if (hasFrom && hasTo) {
    if (!DATE_KEY.test(fromRaw) || !DATE_KEY.test(toRaw)) {
      return { ok: false, error: 'from and to must be YYYY-MM-DD.' };
    }
    if (fromRaw > toRaw) {
      return { ok: false, error: 'from must be on or before to.' };
    }
    if (inclusiveDaySpan(fromRaw, toRaw) > BOOKINGS_RANGE_MAX_DAYS) {
      return {
        ok: false,
        error: `Date range cannot exceed ${BOOKINGS_RANGE_MAX_DAYS} days.`,
      };
    }
    if (cursorRaw) {
      return { ok: false, error: 'cursor cannot be used with from and to.' };
    }
    return { ok: true, query: { kind: 'range', from: fromRaw, to: toRaw } };
  }

  const limitRaw = searchParams.get('limit');
  let limit = BOOKINGS_LIST_DEFAULT_LIMIT;
  if (limitRaw != null && limitRaw.trim() !== '') {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: 'limit must be a positive whole number.' };
    }
    limit = Math.min(parsed, BOOKINGS_LIST_MAX_LIMIT);
  }

  const filterRaw = searchParams.get('filter')?.trim() || 'upcoming';
  if (!isBookingsListFilter(filterRaw)) {
    return {
      ok: false,
      error: 'filter must be upcoming, past, or cancelled.',
    };
  }

  const asOfRaw = searchParams.get('asOf')?.trim() || defaultListAsOf();
  if (!DATE_KEY.test(asOfRaw)) {
    return { ok: false, error: 'asOf must be YYYY-MM-DD.' };
  }

  if (!cursorRaw) {
    return {
      ok: true,
      query: { kind: 'page', limit, filter: filterRaw, asOf: asOfRaw },
    };
  }

  const cursor = parseBookingListCursor(cursorRaw);
  if (!cursor) {
    return {
      ok: false,
      error: 'cursor must be the nextCursor from the previous page.',
    };
  }

  return {
    ok: true,
    query: { kind: 'page', limit, cursor, filter: filterRaw, asOf: asOfRaw },
  };
}
