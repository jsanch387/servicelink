/**
 * Sends the appointment confirmation email to the customer (V2 availability booking).
 * Best-effort: failures are logged by the caller; booking creation is never rolled back.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingEmailHtml,
  getAvailabilityBookingCustomerSubject,
} from './availabilityBookingNotificationTemplate';
import type {
  AvailabilityBookingNotificationPayload,
  SendAvailabilityBookingNotificationResult,
} from './types';

/**
 * Sends the customer-facing confirmation to the address they provided on the booking form.
 */
export async function sendAvailabilityBookingCustomerConfirmationEmail(
  to: string,
  businessName: string,
  payload: AvailabilityBookingNotificationPayload
): Promise<SendAvailabilityBookingNotificationResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getAvailabilityBookingCustomerSubject(businessName);
  const html = buildAvailabilityBookingEmailHtml(payload, {
    audience: 'customer',
    businessName,
  });

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject,
    html,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
