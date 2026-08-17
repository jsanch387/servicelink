import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMembershipCanceledEmailHtml,
  buildMembershipCanceledEmailPlainText,
  getMembershipCanceledEmailSubject,
} from './membershipCanceledEmailTemplate';
import type {
  MembershipCanceledEmailPayload,
  SendMembershipCanceledEmailResult,
} from './types';

export async function sendMembershipCanceledEmail(
  to: string,
  payload: MembershipCanceledEmailPayload
): Promise<SendMembershipCanceledEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getMembershipCanceledEmailSubject(payload.businessName);
  const html = buildMembershipCanceledEmailHtml(payload);
  const text = buildMembershipCanceledEmailPlainText(payload);

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
