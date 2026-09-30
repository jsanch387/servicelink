import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import { getFromEmail, getResendClient } from '../services/resendClient';
import {
  buildCustomerInvoiceEmailHtml,
  buildCustomerInvoiceEmailText,
  customerInvoiceEmailSubject,
  type CustomerInvoiceEmailPayload,
} from './customerInvoiceEmailTemplate';

export type SendCustomerInvoiceEmailInput = CustomerInvoiceEmailPayload & {
  to: string;
  replyTo: string | null;
};

export async function sendCustomerInvoiceEmail(
  input: SendCustomerInvoiceEmailInput
): Promise<{ sent: true } | { sent: false; error: string }> {
  const recipient = normalizedCustomerRecipientEmail(input.to);
  if (!recipient) {
    return { sent: false, error: 'Add an email to send this invoice.' };
  }

  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'Email is not configured yet.' };
  }

  const payload: CustomerInvoiceEmailPayload = {
    businessName: input.businessName,
    customerName: input.customerName,
    invoiceNumber: input.invoiceNumber,
    totalCents: input.totalCents,
    dueOn: input.dueOn,
    invoiceUrl: input.invoiceUrl,
    paid: input.paid,
  };

  const replyTo = normalizedCustomerRecipientEmail(input.replyTo ?? '');

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
    subject: customerInvoiceEmailSubject(payload),
    html: buildCustomerInvoiceEmailHtml(payload),
    text: buildCustomerInvoiceEmailText(payload),
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) return { sent: false, error: error.message };
  if (!data?.id) return { sent: false, error: 'Could not send this email.' };
  return { sent: true };
}
