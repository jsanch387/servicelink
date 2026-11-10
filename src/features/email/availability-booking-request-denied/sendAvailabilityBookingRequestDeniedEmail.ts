/**
 * Customer email when the business denies an appointment request.
 * This visit was never confirmed, so it does not use the cancellation email.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingRequestDeniedHtml,
  buildAvailabilityBookingRequestDeniedPlainText,
  getAvailabilityBookingRequestDeniedSubject,
} from './availabilityBookingRequestDeniedTemplate';
import type {
  AvailabilityBookingRequestDeniedPayload,
  SendAvailabilityBookingRequestDeniedResult,
} from './types';

export async function sendAvailabilityBookingRequestDeniedEmail(
  to: string,
  payload: AvailabilityBookingRequestDeniedPayload
): Promise<SendAvailabilityBookingRequestDeniedResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject: getAvailabilityBookingRequestDeniedSubject(),
    html: buildAvailabilityBookingRequestDeniedHtml(payload),
    text: buildAvailabilityBookingRequestDeniedPlainText(payload),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
