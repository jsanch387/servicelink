import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildJobAssignedEmailHtml,
  buildJobAssignedEmailPlainText,
  getJobAssignedEmailSubject,
} from './jobAssignedTemplate';
import type {
  JobAssignedEmailPayload,
  SendJobAssignedEmailResult,
} from './types';

export async function sendJobAssignedEmail(
  to: string,
  payload: JobAssignedEmailPayload
): Promise<SendJobAssignedEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getJobAssignedEmailSubject(payload.businessName);
  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject,
    html: buildJobAssignedEmailHtml(payload),
    text: buildJobAssignedEmailPlainText(payload),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true, messageId: data.id };
}
