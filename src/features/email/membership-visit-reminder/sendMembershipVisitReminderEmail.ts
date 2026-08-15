import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMembershipVisitReminderHtml,
  buildMembershipVisitReminderPlainText,
  getMembershipVisitReminderSubject,
} from './membershipVisitReminderTemplate';
import type {
  MembershipVisitReminderPayload,
  SendMembershipVisitReminderResult,
} from './types';

export async function sendMembershipVisitReminderEmail(
  to: string,
  payload: MembershipVisitReminderPayload
): Promise<SendMembershipVisitReminderResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'Customer has no email on file' };
  }

  if (!payload.scheduleUrl.trim()) {
    return { sent: false, error: 'Missing schedule URL' };
  }

  const subject = getMembershipVisitReminderSubject(payload.businessName);
  const html = buildMembershipVisitReminderHtml(payload);
  const text = buildMembershipVisitReminderPlainText(payload);

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
