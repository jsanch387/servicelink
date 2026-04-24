/**
 * Loads booking rows for the public ICS calendar feed (service role).
 * Only statuses that should appear in the owner’s subscribed calendar.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'bookings';

export type CalendarFeedBookingRow = Pick<
  BookingRow,
  | 'id'
  | 'service_name'
  | 'scheduled_date'
  | 'start_time'
  | 'duration_minutes'
  | 'customer_name'
  | 'customer_phone'
  | 'customer_street_address'
  | 'customer_city'
  | 'customer_state'
  | 'customer_zip'
  | 'customer_notes'
  | 'status'
>;

/**
 * Confirmed = active upcoming/current slot. Cancelled rows are included so
 * subscribed calendars can drop events when a booking is cancelled (same UID).
 */
export async function listBookingsForCalendarFeed(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<CalendarFeedBookingRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select(
      'id, service_name, scheduled_date, start_time, duration_minutes, customer_name, customer_phone, customer_street_address, customer_city, customer_state, customer_zip, customer_notes, status'
    )
    .eq('business_id', businessId)
    .in('status', ['confirmed', 'cancelled'])
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CalendarFeedBookingRow[];
}
