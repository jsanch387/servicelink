import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildTeamInviteEmailHtml,
  buildTeamInviteEmailPlainText,
  getTeamInviteEmailSubject,
} from './teamInviteTemplate';
import type {
  SendTeamInviteEmailResult,
  TeamInviteEmailPayload,
} from './types';

export async function sendTeamInviteEmail(
  to: string,
  payload: TeamInviteEmailPayload
): Promise<SendTeamInviteEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getTeamInviteEmailSubject(payload.businessName);
  const html = buildTeamInviteEmailHtml(payload);
  const text = buildTeamInviteEmailPlainText(payload);

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
