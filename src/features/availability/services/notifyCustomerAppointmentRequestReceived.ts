/**
 * Customer email and SMS right after they submit an appointment request.
 * This says the request was received. Approval sends the confirmation later.
 * A missing contact is skipped. Failures never roll back the request.
 */

import { sendAvailabilityBookingRequestReceivedEmail } from '@/features/email';
import {
  buildBookingRequestReceivedSms,
  sendAndRecordSms,
} from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const APPOINTMENT_REQUEST_RECEIVED_SMS_TYPE = 'booking_request_received';

export type AppointmentRequestReceivedNotifyResult = {
  email: 'sent' | 'skipped' | 'failed';
  sms: 'sent' | 'skipped' | 'failed' | 'no_phone';
};

const SMS_SKIP_REASONS = new Set([
  'duplicate',
  'no_phone',
  'sms_opt_out',
  'carrier_opt_out',
  'not_eligible',
  'not_configured',
]);

export async function notifyCustomerAppointmentRequestReceived(params: {
  admin: SupabaseClient<Database>;
  businessId: string;
  bookingId: string;
  customerId: string | null;
  businessName: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceName: string;
  scheduledDate: string;
  startTime: string;
  /** Form opt-in when the customer just chose it. False skips the text. */
  smsOptIn: boolean;
  correlationId?: string | null;
}): Promise<AppointmentRequestReceivedNotifyResult> {
  const bookingId = params.bookingId.trim();
  const businessName = params.businessName.trim() || 'your provider';
  const scheduledDate = params.scheduledDate.trim();
  const startTime = params.startTime.trim();

  const sendEmail = async (): Promise<
    AppointmentRequestReceivedNotifyResult['email']
  > => {
    const email = params.customerEmail?.trim() || '';
    if (!email) return 'skipped';
    try {
      const mail = await sendAvailabilityBookingRequestReceivedEmail(email, {
        businessName,
        customerName: params.customerName?.trim() || null,
        serviceName: params.serviceName.trim() || 'Appointment',
        scheduledDate,
        startTime,
      });
      if (!mail.sent) {
        console.warn('[booking-request-received] customer email failed', {
          bookingId,
          reason: mail.error,
        });
        return 'failed';
      }
      return 'sent';
    } catch (e) {
      console.warn('[booking-request-received] customer email failed', {
        bookingId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      });
      return 'failed';
    }
  };

  const sendSms = async (): Promise<
    AppointmentRequestReceivedNotifyResult['sms']
  > => {
    const phone = params.customerPhone?.trim() || '';
    if (!phone) return 'no_phone';
    if (!params.smsOptIn) return 'skipped';

    const sms = await sendAndRecordSms({
      admin: params.admin,
      businessId: params.businessId,
      bookingId,
      customerId: params.customerId,
      type: APPOINTMENT_REQUEST_RECEIVED_SMS_TYPE,
      to: phone,
      message: buildBookingRequestReceivedSms({
        businessName,
        scheduledDate,
        startTime,
      }),
      dedupeKey: `${bookingId}:${APPOINTMENT_REQUEST_RECEIVED_SMS_TYPE}`,
      correlationId: params.correlationId ?? undefined,
    });
    if (sms.sent) return 'sent';
    if (SMS_SKIP_REASONS.has(sms.reason)) return 'skipped';
    return 'failed';
  };

  const [email, sms] = await Promise.all([sendEmail(), sendSms()]);
  return { email, sms };
}
