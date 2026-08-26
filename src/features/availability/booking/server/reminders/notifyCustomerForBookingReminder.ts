/**
 * Day-before customer reminder: email if we have an address, SMS if we have
 * a phone. SMS goes through sendAndRecordSms so it appears in the owner inbox.
 * Email and SMS run in parallel when both contacts exist.
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import { sendAvailabilityBookingReminderEmail } from '@/features/email';
import { buildBookingReminderSms, sendAndRecordSms } from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const CUSTOMER_BOOKING_REMINDER_SMS_TYPE = 'booking_reminder';

export type CustomerBookingReminderNotifyResult = {
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

export function customerBookingReminderSmsDedupeKey(
  bookingId: string,
  scheduledDate: string
): string {
  return `${bookingId.trim()}:booking_reminder:${scheduledDate.trim()}`;
}

export async function notifyCustomerForBookingReminder(
  admin: SupabaseClient<Database>,
  params: {
    bookingId: string;
    businessId: string;
    businessName: string;
    scheduledDate: string;
    startTime: string;
    serviceName: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerId: string | null;
    correlationId?: string | null;
  }
): Promise<CustomerBookingReminderNotifyResult> {
  const correlationId = params.correlationId ?? undefined;

  const sendEmail = async (): Promise<
    CustomerBookingReminderNotifyResult['email']
  > => {
    const email = params.customerEmail?.trim() || '';
    if (!email) return 'skipped';
    try {
      const mail = await sendAvailabilityBookingReminderEmail(email, {
        businessName: params.businessName,
        customerName: params.customerName,
        serviceName: params.serviceName,
        scheduledDate: params.scheduledDate,
        startTime: params.startTime,
      });
      if (!mail.sent) {
        logAvailabilityOwnerNotify(
          correlationId,
          'warn',
          'customer_reminder_email_failed',
          { bookingId: params.bookingId, error: mail.error }
        );
        return 'failed';
      }
      return 'sent';
    } catch (e) {
      logAvailabilityOwnerNotify(
        correlationId,
        'warn',
        'customer_reminder_email_failed',
        {
          bookingId: params.bookingId,
          message: e instanceof Error ? e.message.slice(0, 200) : String(e),
        }
      );
      return 'failed';
    }
  };

  const sendSms = async (): Promise<
    CustomerBookingReminderNotifyResult['sms']
  > => {
    const phone = params.customerPhone?.trim() || '';
    if (!phone) return 'skipped';

    const sms = await sendAndRecordSms({
      admin,
      businessId: params.businessId,
      bookingId: params.bookingId,
      customerId: params.customerId,
      type: CUSTOMER_BOOKING_REMINDER_SMS_TYPE,
      to: phone,
      message: buildBookingReminderSms({
        scheduledDate: params.scheduledDate,
        startTime: params.startTime,
      }),
      dedupeKey: customerBookingReminderSmsDedupeKey(
        params.bookingId,
        params.scheduledDate
      ),
      correlationId,
    });
    if (sms.sent) return 'sent';
    if (SMS_SKIP_REASONS.has(sms.reason)) return 'skipped';
    return 'failed';
  };

  const [email, sms] = await Promise.all([sendEmail(), sendSms()]);
  return { email, sms };
}
