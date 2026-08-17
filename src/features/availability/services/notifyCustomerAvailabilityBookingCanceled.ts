/**
 * Best-effort customer email after an owner cancels a booking.
 * Failures never roll back the cancel.
 */

import { sendAvailabilityBookingCanceledEmail } from '@/features/email/availability-booking-canceled/sendAvailabilityBookingCanceledEmail';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '../booking/dashboard/utils/mapBookingRowToDisplay';

export async function notifyCustomerAvailabilityBookingCanceled(
  supabase: SupabaseClient<Database>,
  booking: BookingRow
): Promise<void> {
  const email = booking.customer_email?.trim() || '';
  if (!email) return;

  const businessId = String(booking.business_id ?? '').trim();
  if (!businessId) return;

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', businessId)
    .maybeSingle();

  const biz = business as {
    business_name?: string | null;
    business_slug?: string | null;
  } | null;

  const businessName =
    biz?.business_name?.trim() || biz?.business_slug?.trim() || 'your provider';

  const result = await sendAvailabilityBookingCanceledEmail(email, {
    businessName,
    customerName: booking.customer_name?.trim() || null,
    serviceName: booking.service_name?.trim() || 'Appointment',
    scheduledDate: String(booking.scheduled_date ?? '').trim(),
    startTime: String(booking.start_time ?? '')
      .trim()
      .slice(0, 5),
  });

  if (!result.sent) {
    console.warn('[booking-canceled] customer email failed', {
      bookingId: booking.id,
      reason: result.error,
    });
  }
}
