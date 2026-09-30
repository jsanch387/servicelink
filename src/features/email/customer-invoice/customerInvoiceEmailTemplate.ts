import {
  formatInvoiceCents,
  formatInvoiceDueDate,
} from '@/features/invoices/utils/invoiceDraft';

import { escapeHtml } from '../utils/escapeHtml';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailFootnote,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';

export type CustomerInvoiceEmailPayload = {
  businessName: string;
  customerName: string;
  invoiceNumber: number;
  totalCents: number;
  dueOn: string | null;
  invoiceUrl: string;
  /** The appointment was already paid, so this bill is a paid record. */
  paid?: boolean;
};

const PROMO_WORDS =
  /\b(sale|discount|offer|deal|unsubscribe|act now|%\s*off)\b/i;

export function customerInvoiceEmailSubject(
  payload: Pick<CustomerInvoiceEmailPayload, 'businessName' | 'invoiceNumber'>
): string {
  const business = payload.businessName.trim() || 'your service provider';
  return `Invoice ${payload.invoiceNumber} from ${business}`;
}

export function buildCustomerInvoiceEmailText(
  payload: CustomerInvoiceEmailPayload
): string {
  const business = payload.businessName.trim() || 'Your service provider';
  const customer = payload.customerName.trim() || 'there';
  const due = formatInvoiceDueDate(payload.dueOn ?? '');
  const amount = formatInvoiceCents(payload.totalCents);
  const amountLabel = payload.paid ? 'Amount paid' : 'Amount due';

  return [
    `${business} sent you invoice ${payload.invoiceNumber}.`,
    '',
    `Hi ${customer},`,
    '',
    `${amountLabel}: ${amount}`,
    `Due: ${due}`,
    '',
    'View your invoice:',
    payload.invoiceUrl,
    '',
    `You received this because ${business} sent you an invoice.`,
  ].join('\n');
}

export function buildCustomerInvoiceEmailHtml(
  payload: CustomerInvoiceEmailPayload
): string {
  const business = payload.businessName.trim() || 'Your service provider';
  const customer = payload.customerName.trim() || 'there';
  const due = formatInvoiceDueDate(payload.dueOn ?? '');
  const amount = formatInvoiceCents(payload.totalCents);
  const amountLabel = payload.paid ? 'Amount paid' : 'Amount due';
  const subject = customerInvoiceEmailSubject(payload);

  const details = [
    serviceLinkEmailDetailRow('From', business),
    serviceLinkEmailDetailRow('Invoice', String(payload.invoiceNumber)),
    serviceLinkEmailDetailRow(amountLabel, amount),
    serviceLinkEmailDetailRow('Due', due, { isLast: true }),
  ].join('');

  const bodyHtml = [
    serviceLinkEmailSection('Invoice', details, { isFirst: true }),
    serviceLinkEmailCta(payload.invoiceUrl, 'View invoice'),
    serviceLinkEmailFootnote(payload.invoiceUrl),
  ].join('');

  return wrapServiceLinkEmail({
    title: subject,
    heading: `Invoice ${payload.invoiceNumber}`,
    subtitle: `Hi ${customer},`,
    bodyHtml,
    footerHtml: escapeHtml(
      `You received this because ${business} sent you an invoice.`
    ),
  });
}

export function customerInvoiceEmailLooksTransactional(
  html: string,
  text: string
): boolean {
  return !PROMO_WORDS.test(html) && !PROMO_WORDS.test(text);
}
