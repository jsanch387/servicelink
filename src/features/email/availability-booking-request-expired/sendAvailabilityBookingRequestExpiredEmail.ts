/**
 * Customer email when an appointment request's day passes without approval.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingRequestExpiredHtml,
  buildAvailabilityBookingRequestExpiredPlainText,
  getAvailabilityBookingRequestExpiredSubject,
} from './availabilityBookingRequestExpiredTemplate';
import type {
  AvailabilityBookingRequestExpiredPayload,
  SendAvailabilityBookingRequestExpiredResult,
} from './types';

export async function sendAvailabilityBookingRequestExpiredEmail(
  to: string,
  payload: AvailabilityBookingRequestExpiredPayload
): Promise<SendAvailabilityBookingRequestExpiredResult> {
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
    subject: getAvailabilityBookingRequestExpiredSubject(),
    html: buildAvailabilityBookingRequestExpiredHtml(payload),
    text: buildAvailabilityBookingRequestExpiredPlainText(payload),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
