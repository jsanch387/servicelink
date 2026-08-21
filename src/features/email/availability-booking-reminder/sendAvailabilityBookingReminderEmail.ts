/**
 * Day-before appointment reminder email to the customer.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingReminderHtml,
  buildAvailabilityBookingReminderPlainText,
  getAvailabilityBookingReminderSubject,
} from './availabilityBookingReminderTemplate';
import type {
  AvailabilityBookingReminderPayload,
  SendAvailabilityBookingReminderResult,
} from './types';

export async function sendAvailabilityBookingReminderEmail(
  to: string,
  payload: AvailabilityBookingReminderPayload
): Promise<SendAvailabilityBookingReminderResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getAvailabilityBookingReminderSubject(payload.businessName);
  const html = buildAvailabilityBookingReminderHtml(payload);
  const text = buildAvailabilityBookingReminderPlainText(payload);

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
