/**
 * Turns a public appointment request into a confirmed booking, then tells
 * the customer. A second approve of an already confirmed row does nothing.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  appointmentRequestExpiryDate,
  expirePastAppointmentRequests,
} from './expirePastAppointmentRequests';
import { notifyCustomerAppointmentRequestApproved } from './notifyCustomerAppointmentRequestApproved';

export type ApproveRequestedBookingResult =
  | { ok: true; row: BookingRow }
  | { ok: false; error: string; httpStatus: number };

export async function approveRequestedBooking(
  supabase: SupabaseClient<Database>,
  params: { businessId: string; bookingId: string }
): Promise<ApproveRequestedBookingResult> {
  const bookingId = params.bookingId.trim();
  const businessId = params.businessId.trim();
  const today = appointmentRequestExpiryDate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from('bookings')
    .update({ status: 'confirmed' })
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
    await notifyCustomerAppointmentRequestApproved(supabase, row);
    return { ok: true, row };
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
    return { ok: false, error: 'Booking not found', httpStatus: 404 };
  }
  if (String(existing.status ?? '') === 'confirmed') {
    return { ok: true, row: existing as BookingRow };
  }
  const scheduledDate = String(existing.scheduled_date ?? '');
  if (String(existing.status ?? '') === 'requested' && scheduledDate < today) {
    await expirePastAppointmentRequests(supabase, {
      asOf: today,
      businessId,
      bookingId,
    });
    return {
      ok: false,
      error: 'This request expired.',
      httpStatus: 409,
    };
  }
  if (String(existing.status ?? '') === 'expired') {
    return {
      ok: false,
      error: 'This request expired.',
      httpStatus: 409,
    };
  }
  return {
    ok: false,
    error: 'Only a request can be approved.',
    httpStatus: 409,
  };
}
