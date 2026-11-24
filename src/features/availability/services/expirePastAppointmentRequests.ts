/**
 * Marks appointment requests expired once their calendar day is over, then
 * tells the customer once. A request already moved off `requested` is left alone.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import {
  BOOKING_REMINDER_TIMEZONE,
  calendarDateInTimeZone,
} from '@/features/availability/booking/server/reminders/ownerBookingReminderDate';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyCustomerAppointmentRequestExpired } from './notifyCustomerAppointmentRequestExpired';

const PAGE_SIZE = 40;

export function appointmentRequestExpiryDate(
  now = new Date(),
  timeZone = BOOKING_REMINDER_TIMEZONE
): string {
  return calendarDateInTimeZone(now, timeZone);
}

export async function expirePastAppointmentRequests(
  supabase: SupabaseClient<Database>,
  params: { asOf: string; businessId?: string; bookingId?: string }
): Promise<{ expired: number }> {
  const asOf = params.asOf.trim();
  const businessId = params.businessId?.trim() || '';
  const bookingId = params.bookingId?.trim() || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    return { expired: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  let expired = 0;

  for (;;) {
    let query = db
      .from('bookings')
      .select('*')
      .eq('status', 'requested')
      .lt('scheduled_date', asOf);
    if (businessId) query = query.eq('business_id', businessId);
    if (bookingId) query = query.eq('id', bookingId);
    query = query.order('id', { ascending: true }).limit(PAGE_SIZE);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as BookingRow[];
    if (rows.length === 0) break;

    let changed = 0;
    for (const row of rows) {
      const { data: updated, error: updateError } = await db
        .from('bookings')
        .update({ status: 'expired' })
        .eq('id', row.id)
        .eq('status', 'requested')
        .select('*')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updated) continue;
      changed += 1;
      expired += 1;
      await notifyCustomerAppointmentRequestExpired(
        supabase,
        updated as BookingRow
      );
    }

    if (changed === 0 || bookingId || rows.length < PAGE_SIZE) break;
  }

  return { expired };
}
