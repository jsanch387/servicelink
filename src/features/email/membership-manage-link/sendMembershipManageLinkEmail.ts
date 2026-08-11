import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMembershipManageLinkHtml,
  buildMembershipManageLinkPlainText,
  getMembershipManageLinkSubject,
} from './membershipManageLinkTemplate';
import type {
  MembershipManageLinkPayload,
  SendMembershipManageLinkResult,
} from './types';

export async function sendMembershipManageLinkEmail(
  to: string,
  payload: MembershipManageLinkPayload
): Promise<SendMembershipManageLinkResult> {
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

  const subject = getMembershipManageLinkSubject(payload.businessName);
  const html = buildMembershipManageLinkHtml(payload);
  const text = buildMembershipManageLinkPlainText(payload);

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
