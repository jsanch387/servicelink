import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildReviewInviteEmailHtml,
  buildReviewInviteEmailPlainText,
  getReviewInviteEmailSubject,
} from './reviewInviteTemplate';
import type {
  ReviewInviteEmailPayload,
  SendReviewInviteEmailResult,
} from './types';

export async function sendReviewInviteEmail(
  to: string,
  payload: ReviewInviteEmailPayload
): Promise<SendReviewInviteEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getReviewInviteEmailSubject(payload.businessName);
  const html = buildReviewInviteEmailHtml(payload);
  const text = buildReviewInviteEmailPlainText(payload);

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
  return { sent: true, messageId: data.id };
}
