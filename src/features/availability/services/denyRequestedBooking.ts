/**
 * Turns down a public appointment request. The row becomes cancelled so the
 * slot opens and the visit shows with other cancellations. The customer hears
 * that it was not confirmed. A second deny does not send again.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  appointmentRequestExpiryDate,
  expirePastAppointmentRequests,
} from './expirePastAppointmentRequests';
import { notifyCustomerAppointmentRequestDenied } from './notifyCustomerAppointmentRequestDenied';

export type DenyRequestedBookingResult =
  | { handled: true; ok: true; row: BookingRow }
  | { handled: true; ok: false; error: string; httpStatus: number }
  | { handled: false };

export async function denyRequestedBooking(
  supabase: SupabaseClient<Database>,
  params: { businessId: string; bookingId: string }
): Promise<DenyRequestedBookingResult> {
  const bookingId = params.bookingId.trim();
  const businessId = params.businessId.trim();
  const today = appointmentRequestExpiryDate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('business_id', businessId)
    .eq('status', 'requested')
    .gte('scheduled_date', today)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    const row = data as BookingRow;
    await notifyCustomerAppointmentRequestDenied(supabase, row);
    return { handled: true, ok: true, row };
  }

  const { data: existing, error: loadError } = await db
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }
  if (!existing) {
    return {
      handled: true,
      ok: false,
      error: 'Booking not found',
      httpStatus: 404,
    };
  }
  if (String(existing.status ?? '') === 'cancelled') {
    return { handled: true, ok: true, row: existing as BookingRow };
  }
  const scheduledDate = String(existing.scheduled_date ?? '');
  if (String(existing.status ?? '') === 'requested' && scheduledDate < today) {
    await expirePastAppointmentRequests(supabase, {
      asOf: today,
      businessId,
      bookingId,
    });
    return {
      handled: true,
      ok: false,
      error: 'This request expired.',
      httpStatus: 409,
    };
  }
  if (String(existing.status ?? '') === 'expired') {
    return {
      handled: true,
      ok: false,
      error: 'This request expired.',
      httpStatus: 409,
    };
  }
  return { handled: false };
}
