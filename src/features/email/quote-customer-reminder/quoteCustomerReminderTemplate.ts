import { formatQuotePublicLinkExpiryDate } from '@/features/quotes/dashboard/utils/formatQuotePublicLinkExpiry';
import { quoteCustomerReminderLead } from '@/features/quotes/shared/quoteCustomerReminderCopy';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { QuoteCustomerReminderPayload } from './types';

function businessLabel(businessName: string): string {
  return businessName.trim() || 'your provider';
}

export function getQuoteCustomerReminderSubject(businessName: string): string {
  return `Your quote from ${businessLabel(businessName)} is still open`;
}

export function buildQuoteCustomerReminderPlainText(
  payload: QuoteCustomerReminderPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Quote';
  const expiry = payload.expiresAt?.trim()
    ? formatQuotePublicLinkExpiryDate(payload.expiresAt.trim())
    : '';

  return [
    'Your quote is still open',
    '',
    quoteCustomerReminderLead(payload.customerName, payload.businessName),
    '',
    `Service: ${service}`,
    expiry ? `Valid until: ${expiry}` : null,
    '',
    'Review quote:',
    payload.publicQuoteUrl.trim(),
    '',
    `Sent for ${business} via ServiceLink`,
  ]
    .filter(line => line !== null)
    .join('\n');
}

export function buildQuoteCustomerReminderHtml(
  payload: QuoteCustomerReminderPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Quote';
  const year = new Date().getFullYear();
  const expiry = payload.expiresAt?.trim()
    ? formatQuotePublicLinkExpiryDate(payload.expiresAt.trim())
    : '';

  const detailRows = [
    serviceLinkEmailDetailRow('Service', service, { isLast: !expiry }),
    expiry
      ? serviceLinkEmailDetailRow('Valid until', expiry, { isLast: true })
      : '',
  ].join('');

  return wrapServiceLinkEmail({
    title: 'Your quote is still open',
    heading: 'Your quote is still open',
    subtitle: quoteCustomerReminderLead(
      payload.customerName,
      payload.businessName
    ),
    bodyHtml: `${serviceLinkEmailSection('Quote', detailRows)}${serviceLinkEmailCta(payload.publicQuoteUrl.trim(), 'Review quote')}`,
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
