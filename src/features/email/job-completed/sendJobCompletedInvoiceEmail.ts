import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildJobCompletedInvoiceEmailHtml,
  buildJobCompletedInvoiceEmailPlainText,
  getJobCompletedInvoiceEmailSubject,
  type JobCompletedInvoiceEmailPayload,
} from './jobCompletedInvoiceTemplate';

export type SendJobCompletedInvoiceEmailPayload =
  JobCompletedInvoiceEmailPayload;

export type SendJobCompletedInvoiceEmailResult =
  | { sent: true; messageId: string }
  | { sent: false; error: string };

function emailFailureReason(
  error: string
): 'no_email' | 'not_configured' | 'error' {
  if (/RESEND_API_KEY/i.test(error)) return 'not_configured';
  if (/recipient email/i.test(error)) return 'no_email';
  return 'error';
}

export function mapJobCompletedEmailFailureReason(error: string): string {
  return emailFailureReason(error);
}

export async function sendJobCompletedInvoiceEmail(
  to: string,
  payload: SendJobCompletedInvoiceEmailPayload
): Promise<SendJobCompletedInvoiceEmailResult> {
  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'No valid recipient email' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getJobCompletedInvoiceEmailSubject(payload.businessName);
  const html = buildJobCompletedInvoiceEmailHtml(payload);
  const text = buildJobCompletedInvoiceEmailPlainText(payload);

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
