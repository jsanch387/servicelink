/**
 * Customer email and SMS after the business denies an appointment request.
 * A missing contact is skipped. Failures never roll back the cancellation.
 */

import { rescheduleEmailServiceName } from '@/features/availability/services/notifyCustomerAvailabilityBookingRescheduled';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { wallClockHHmm } from '@/features/availability/booking/utils/wallClockHHmm';
import { sendAvailabilityBookingRequestDeniedEmail } from '@/features/email';
import { buildBookingRequestDeniedSms, sendAndRecordSms } from '@/features/sms';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const APPOINTMENT_REQUEST_DENIED_SMS_TYPE = 'booking_request_denied';

const SMS_SKIP_REASONS = new Set([
  'duplicate',
  'no_phone',
  'sms_opt_out',
  'carrier_opt_out',
  'not_eligible',
  'not_configured',
]);

export async function notifyCustomerAppointmentRequestDenied(
  supabase: SupabaseClient<Database>,
  booking: BookingRow
): Promise<void> {
  const bookingId = String(booking.id ?? '').trim();
  const businessId = String(booking.business_id ?? '').trim();
  const scheduledDate = String(booking.scheduled_date ?? '').trim();
  const startTime = wallClockHHmm(String(booking.start_time ?? ''));
  if (!bookingId || !businessId || !scheduledDate || !startTime) return;

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

  const email = booking.customer_email?.trim() || '';
  if (email) {
    try {
      const mail = await sendAvailabilityBookingRequestDeniedEmail(email, {
        businessName,
        customerName: booking.customer_name?.trim() || null,
        serviceName: rescheduleEmailServiceName(booking),
        scheduledDate,
        startTime,
      });
      if (!mail.sent) {
        console.warn('[booking-request-denied] customer email failed', {
          bookingId,
          reason: mail.error,
        });
      }
    } catch (e) {
      console.warn('[booking-request-denied] customer email failed', {
        bookingId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      });
    }
  }

  const phone = booking.customer_phone?.trim() || '';
  if (!phone) return;

  let admin: SupabaseClient<Database>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.warn(
      '[booking-request-denied] sms skipped, admin client unavailable',
      {
        bookingId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      }
    );
    return;
  }

  const sms = await sendAndRecordSms({
    admin,
    businessId,
    bookingId,
    customerId: booking.customer_id,
    type: APPOINTMENT_REQUEST_DENIED_SMS_TYPE,
    to: phone,
    message: buildBookingRequestDeniedSms({
      businessName,
      scheduledDate,
      startTime,
    }),
    dedupeKey: `${bookingId}:${APPOINTMENT_REQUEST_DENIED_SMS_TYPE}`,
  });
  if (!sms.sent && !SMS_SKIP_REASONS.has(sms.reason)) {
    console.warn('[booking-request-denied] customer sms failed', {
      bookingId,
      reason: sms.reason,
    });
  }
}
