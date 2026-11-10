/**
 * Customer email when a public appointment request is saved.
 * This is not a confirmation. Approval sends that later.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildAvailabilityBookingRequestReceivedHtml,
  buildAvailabilityBookingRequestReceivedPlainText,
  getAvailabilityBookingRequestReceivedSubject,
} from './availabilityBookingRequestReceivedTemplate';
import type {
  AvailabilityBookingRequestReceivedPayload,
  SendAvailabilityBookingRequestReceivedResult,
} from './types';

export async function sendAvailabilityBookingRequestReceivedEmail(
  to: string,
  payload: AvailabilityBookingRequestReceivedPayload
): Promise<SendAvailabilityBookingRequestReceivedResult> {
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
    subject: getAvailabilityBookingRequestReceivedSubject(),
    html: buildAvailabilityBookingRequestReceivedHtml(payload),
    text: buildAvailabilityBookingRequestReceivedPlainText(payload),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
