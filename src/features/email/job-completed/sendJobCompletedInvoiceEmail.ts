import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';

export interface SendJobCompletedInvoiceEmailPayload {
  businessName: string;
  customerName: string;
  invoiceUrl: string;
  includeReviewHint: boolean;
}

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

  const businessName = payload.businessName.trim() || 'Your provider';
  const greeting = payload.customerName.trim() || 'there';
  const subject = `Your receipt from ${businessName}`;
  const reviewLine = payload.includeReviewHint
    ? ' I would appreciate it if you could leave us a review.'
    : '';
  const text = `Hi ${greeting},\n\nThanks for choosing ${businessName}.${reviewLine}\n\nView your receipt: ${payload.invoiceUrl}\n`;
  const html = `<p>Hi ${greeting},</p><p>Thanks for choosing <strong>${businessName}</strong>.${reviewLine ? ` I would appreciate it if you could leave us a review.` : ''}</p><p><a href="${payload.invoiceUrl}">View your receipt</a></p>`;

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
