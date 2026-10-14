/**
 * Best-effort customer email and SMS after an owner reschedules a booking.
 * Both channels send when both contacts exist. Failures never roll back the
 * reschedule. SMS is logged through sendAndRecordSms (owner message history).
 */

import { parseStoredBookingJobDetails } from '@/features/availability/booking/utils/parseStoredBookingJobDetails';
import { parseStoredBookingServiceName } from '@/features/availability/booking/utils/parseStoredBookingServiceName';
import { wallClockHHmm } from '@/features/availability/booking/utils/wallClockHHmm';
import { sendAvailabilityBookingRescheduledEmail } from '@/features/email/availability-booking-rescheduled/sendAvailabilityBookingRescheduledEmail';
import { buildBookingRescheduledSms, sendAndRecordSms } from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '../booking/dashboard/utils/mapBookingRowToDisplay';

export const CUSTOMER_BOOKING_RESCHEDULED_SMS_TYPE = 'booking_rescheduled';

export type CustomerBookingRescheduledNotifyResult = {
  email: 'sent' | 'skipped' | 'failed';
  sms: 'sent' | 'skipped' | 'failed';
};

const SMS_SKIP_REASONS = new Set([
  'duplicate',
  'no_phone',
  'sms_opt_out',
  'carrier_opt_out',
  'not_eligible',
  'not_configured',
]);

/** Service label for the customer email, without a pricing-option suffix. */
export function rescheduleEmailServiceName(booking: BookingRow): string {
  const jobs = parseStoredBookingJobDetails(booking.job_details);
  if (jobs.length > 0) {
    const first = jobs[0]?.serviceName.trim() || 'Appointment';
    if (jobs.length === 1) return first;
    return `${first} + ${jobs.length - 1} more`;
  }

  return (
    parseStoredBookingServiceName(booking.service_name ?? '').serviceName ||
    'Appointment'
  );
}

export function customerBookingRescheduledSmsDedupeKey(params: {
  bookingId: string;
  previousScheduledDate: string;
  previousStartTime: string;
  scheduledDate: string;
  startTime: string;
}): string {
  const from = `${params.previousScheduledDate.trim()}T${wallClockHHmm(params.previousStartTime)}`;
  const to = `${params.scheduledDate.trim()}T${wallClockHHmm(params.startTime)}`;
  return `${params.bookingId.trim()}:booking_rescheduled:${from}:${to}`;
}

export async function notifyCustomerAvailabilityBookingRescheduled(
  supabase: SupabaseClient<Database>,
  params: {
    booking: BookingRow;
    previousScheduledDate: string;
    previousStartTime: string;
  }
): Promise<CustomerBookingRescheduledNotifyResult> {
  const booking = params.booking;
  const bookingId = String(booking.id ?? '').trim();
  const businessId = String(booking.business_id ?? '').trim();
  const scheduledDate = String(booking.scheduled_date ?? '').trim();
  const startTime = wallClockHHmm(String(booking.start_time ?? ''));
  const previousScheduledDate = params.previousScheduledDate.trim();
  const previousStartTime = wallClockHHmm(params.previousStartTime);

  if (!bookingId || !businessId || !scheduledDate || !startTime) {
    return { email: 'skipped', sms: 'skipped' };
  }

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
  const serviceName = rescheduleEmailServiceName(booking);
  const customerName = booking.customer_name?.trim() || null;

  const sendEmail = async (): Promise<
    CustomerBookingRescheduledNotifyResult['email']
  > => {
    const email = booking.customer_email?.trim() || '';
    if (!email) return 'skipped';
    try {
      const mail = await sendAvailabilityBookingRescheduledEmail(email, {
        businessName,
        customerName,
        serviceName,
        scheduledDate,
        startTime,
        previousScheduledDate: previousScheduledDate || null,
        previousStartTime: previousStartTime || null,
      });
      if (!mail.sent) {
        console.warn('[booking-rescheduled] customer email failed', {
          bookingId,
          reason: mail.error,
        });
        return 'failed';
      }
      return 'sent';
    } catch (e) {
      console.warn('[booking-rescheduled] customer email failed', {
        bookingId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      });
      return 'failed';
    }
  };

  const sendSms = async (): Promise<
    CustomerBookingRescheduledNotifyResult['sms']
  > => {
    const phone = booking.customer_phone?.trim() || '';
    if (!phone) return 'skipped';

    let admin: SupabaseClient<Database>;
    try {
      admin = createSupabaseAdminClient();
    } catch (e) {
      console.warn(
        '[booking-rescheduled] sms skipped, admin client unavailable',
        {
          bookingId,
          message: e instanceof Error ? e.message.slice(0, 200) : String(e),
        }
      );
      return 'skipped';
    }

    const sms = await sendAndRecordSms({
      admin,
      businessId,
      bookingId,
      customerId: booking.customer_id,
      type: CUSTOMER_BOOKING_RESCHEDULED_SMS_TYPE,
      to: phone,
      message: buildBookingRescheduledSms({
        businessName,
        scheduledDate,
        startTime,
      }),
      dedupeKey: customerBookingRescheduledSmsDedupeKey({
        bookingId,
        previousScheduledDate,
        previousStartTime,
        scheduledDate,
        startTime,
      }),
    });
    if (sms.sent) return 'sent';
    if (SMS_SKIP_REASONS.has(sms.reason)) return 'skipped';
    return 'failed';
  };

  const [email, sms] = await Promise.all([sendEmail(), sendSms()]);
  return { email, sms };
}
