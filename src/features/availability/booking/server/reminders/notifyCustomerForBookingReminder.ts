/**
 * Day-before customer reminder: email if we have an address, SMS if we have
 * a phone. SMS goes through sendAndRecordSms so it appears in the owner inbox.
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
  const result: CustomerBookingReminderNotifyResult = {
    email: 'skipped',
    sms: 'skipped',
  };
  const correlationId = params.correlationId ?? undefined;

  const email = params.customerEmail?.trim() || '';
  if (email) {
    try {
      const mail = await sendAvailabilityBookingReminderEmail(email, {
        businessName: params.businessName,
        customerName: params.customerName,
        serviceName: params.serviceName,
        scheduledDate: params.scheduledDate,
        startTime: params.startTime,
      });
      result.email = mail.sent ? 'sent' : 'failed';
      if (!mail.sent) {
        logAvailabilityOwnerNotify(
          correlationId,
          'warn',
          'customer_reminder_email_failed',
          { bookingId: params.bookingId, error: mail.error }
        );
      }
    } catch (e) {
      result.email = 'failed';
      logAvailabilityOwnerNotify(
        correlationId,
        'warn',
        'customer_reminder_email_failed',
        {
          bookingId: params.bookingId,
          message: e instanceof Error ? e.message.slice(0, 200) : String(e),
        }
      );
    }
  }

  const phone = params.customerPhone?.trim() || '';
  if (phone) {
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
    if (sms.sent) {
      result.sms = 'sent';
    } else if (
      sms.reason === 'duplicate' ||
      sms.reason === 'no_phone' ||
      sms.reason === 'sms_opt_out' ||
      sms.reason === 'not_eligible' ||
      sms.reason === 'not_configured'
    ) {
      result.sms = 'skipped';
    } else {
      result.sms = 'failed';
    }
  }

  return result;
}
