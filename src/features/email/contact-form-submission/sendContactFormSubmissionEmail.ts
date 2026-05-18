import { SERVICELINK_SUPPORT_EMAIL } from '@/constants/support';
import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildContactFormSubmissionHtml,
  buildContactFormSubmissionPlainText,
  getContactFormSubmissionSubject,
} from './contactFormSubmissionTemplate';
import type {
  ContactFormSubmissionPayload,
  SendContactFormSubmissionResult,
} from './types';

export async function sendContactFormSubmissionEmail(
  payload: ContactFormSubmissionPayload
): Promise<SendContactFormSubmissionResult> {
  const replyTo = normalizedCustomerRecipientEmail(payload.email);
  if (!replyTo) {
    return { sent: false, error: 'No valid sender email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getContactFormSubmissionSubject(payload.topic, payload.name);
  const html = buildContactFormSubmissionHtml(payload);
  const text = buildContactFormSubmissionPlainText(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [SERVICELINK_SUPPORT_EMAIL],
    replyTo,
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
