import { BOOKINGS_RANGE_MAX_ROWS } from '@/features/availability/booking/constants';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '../dashboard/utils/mapBookingRowToDisplay';
import {
  bookingListKeysetOr,
  cursorFromBookingRow,
  encodeBookingListCursor,
} from '../utils/bookingListCursor';
import { hydrateBookingRowsForDisplay } from './hydrateBookingRowsForDisplay';
import type {
  BookingsListFilter,
  ListBookingsQuery,
} from './parseListBookingsQuery';

function applyListFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  filter: BookingsListFilter,
  asOf: string
) {
  if (filter === 'upcoming') {
    return request.eq('status', 'confirmed').gte('scheduled_date', asOf);
  }
  if (filter === 'cancelled') {
    return request.eq('status', 'cancelled');
  }
  return request.or(
    `status.eq.completed,and(status.eq.confirmed,scheduled_date.lt.${asOf})`
  );
}

export interface ListBookingsForOwnerResult {
  bookings: Awaited<ReturnType<typeof hydrateBookingRowsForDisplay>>;
  hasMore: boolean;
  nextCursor: string | null;
}

export async function listBookingsForOwner(
  supabase: SupabaseClient<Database>,
  businessId: string,
  query: ListBookingsQuery
): Promise<ListBookingsForOwnerResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request = (supabase as any)
    .from('bookings')
    .select('*')
    .eq('business_id', businessId);

  const fetchLimit =
    query.kind === 'range' ? BOOKINGS_RANGE_MAX_ROWS + 1 : query.limit + 1;

  if (query.kind === 'range') {
    request = request
      .gte('scheduled_date', query.from)
      .lte('scheduled_date', query.to)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(fetchLimit);
  } else {
    const ascending = query.filter === 'upcoming';
    request = applyListFilter(request, query.filter, query.asOf)
      .order('scheduled_date', { ascending })
      .order('start_time', { ascending })
      .order('id', { ascending });
    if (query.cursor) {
      request = request.or(
        bookingListKeysetOr(query.cursor, ascending ? 'asc' : 'desc')
      );
    }
    request = request.limit(fetchLimit);
  }

  const { data, error } = await request;
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as BookingRow[];
  const hasMore = rows.length > fetchLimit - 1;
  const pageRows = hasMore ? rows.slice(0, fetchLimit - 1) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    query.kind === 'page' && hasMore && lastRow
      ? encodeBookingListCursor(cursorFromBookingRow(lastRow))
      : null;

  return {
    bookings: await hydrateBookingRowsForDisplay(
      supabase,
      businessId,
      pageRows
    ),
    hasMore,
    nextCursor,
  };
}
