/**
 * Customer email when an owner cancels their appointment.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingCanceledHtml,
  buildAvailabilityBookingCanceledPlainText,
  getAvailabilityBookingCanceledSubject,
} from './availabilityBookingCanceledTemplate';
import type {
  AvailabilityBookingCanceledPayload,
  SendAvailabilityBookingCanceledResult,
} from './types';

export async function sendAvailabilityBookingCanceledEmail(
  to: string,
  payload: AvailabilityBookingCanceledPayload
): Promise<SendAvailabilityBookingCanceledResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getAvailabilityBookingCanceledSubject(payload.businessName);
  const html = buildAvailabilityBookingCanceledHtml(payload);
  const text = buildAvailabilityBookingCanceledPlainText(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject,
    html,
    text,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
