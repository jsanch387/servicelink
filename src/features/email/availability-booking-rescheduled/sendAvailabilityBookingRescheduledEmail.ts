/**
 * Customer email when an owner moves their appointment to a new time.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingRescheduledHtml,
  buildAvailabilityBookingRescheduledPlainText,
  getAvailabilityBookingRescheduledSubject,
} from './availabilityBookingRescheduledTemplate';
import type {
  AvailabilityBookingRescheduledPayload,
  SendAvailabilityBookingRescheduledResult,
} from './types';

export async function sendAvailabilityBookingRescheduledEmail(
  to: string,
  payload: AvailabilityBookingRescheduledPayload
): Promise<SendAvailabilityBookingRescheduledResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getAvailabilityBookingRescheduledSubject(
    payload.businessName
  );
  const html = buildAvailabilityBookingRescheduledHtml(payload);
  const text = buildAvailabilityBookingRescheduledPlainText(payload);

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
