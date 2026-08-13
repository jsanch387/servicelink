import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMembershipInvoicePaymentFailedHtml,
  buildMembershipInvoicePaymentFailedPlainText,
  getMembershipInvoicePaymentFailedSubject,
} from './membershipInvoicePaymentFailedTemplate';
import type {
  MembershipInvoiceEmailPayload,
  SendMembershipInvoiceEmailResult,
} from './types';

export async function sendMembershipInvoicePaymentFailedEmail(
  to: string,
  payload: MembershipInvoiceEmailPayload
): Promise<SendMembershipInvoiceEmailResult> {
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

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject: getMembershipInvoicePaymentFailedSubject(payload.businessName),
    html: buildMembershipInvoicePaymentFailedHtml(payload),
    text: buildMembershipInvoicePaymentFailedPlainText(payload),
  });

  if (error) return { sent: false, error: error.message };
  if (!data?.id) return { sent: false, error: 'Resend did not return an id' };
  return { sent: true };
}
