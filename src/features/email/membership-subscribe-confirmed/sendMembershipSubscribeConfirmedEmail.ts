import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMembershipSubscribeConfirmedHtml,
  buildMembershipSubscribeConfirmedPlainText,
  getMembershipSubscribeConfirmedSubject,
} from './membershipSubscribeConfirmedTemplate';
import type {
  MembershipSubscribeConfirmedPayload,
  SendMembershipSubscribeConfirmedResult,
} from './types';

export async function sendMembershipSubscribeConfirmedEmail(
  to: string,
  payload: MembershipSubscribeConfirmedPayload
): Promise<SendMembershipSubscribeConfirmedResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'Customer has no email on file' };
  }

  if (!payload.manageUrl.trim()) {
    return { sent: false, error: 'Missing manage URL' };
  }

  const subject = getMembershipSubscribeConfirmedSubject(payload.businessName);
  const html = buildMembershipSubscribeConfirmedHtml(payload);
  const text = buildMembershipSubscribeConfirmedPlainText(payload);

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
