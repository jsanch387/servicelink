/**
 * Owner email when a customer submits a public quote request.
 * One request card. Empty fields are omitted.
 */

import { escapeHtml } from '../utils/escapeHtml';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  SERVICE_LINK_EMAIL_FONT,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { QuoteRequestOwnerNotificationPayload } from './types';

/** Full-width rule between the details and the message, with equal space on both sides. */
function dividerRow(): string {
  return `
    <tr>
      <td colspan="2" style="padding:16px 0;font-size:0;line-height:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-top:1px solid #2a2a2a;font-size:0;line-height:0;height:1px;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  `.trim();
}

function messageRow(value: string): string {
  const body = escapeHtml(value.trim()).replace(/\r?\n/g, '<br />');
  return `
    <tr>
      <td colspan="2" style="padding:0;font-family:${SERVICE_LINK_EMAIL_FONT};">
        <div style="font-size:13px;line-height:20px;color:#737373;">Message</div>
        <div style="margin-top:6px;font-size:14px;line-height:22px;font-weight:500;color:#fafafa;">${body}</div>
      </td>
    </tr>
  `.trim();
}

export function getQuoteRequestOwnerNotificationSubject(
  customerName: string
): string {
  const name = customerName.trim() || 'a customer';
  return `New quote request from ${name}`;
}

export function buildQuoteRequestOwnerNotificationHtml(
  payload: QuoteRequestOwnerNotificationPayload,
  dashboardQuoteRequestUrl: string
): string {
  const customerName = payload.customerName.trim();
  const serviceName = payload.serviceName.trim();
  const vehicle = payload.vehicleSummary?.trim() ?? '';
  const timeline = payload.timeline?.trim() ?? '';
  const message = payload.detailsPreview.trim();

  const details: Array<{ label: string; value: string }> = [];
  if (customerName) details.push({ label: 'Customer', value: customerName });
  if (serviceName) details.push({ label: 'Service', value: serviceName });
  if (vehicle) details.push({ label: 'Vehicle', value: vehicle });
  if (timeline) details.push({ label: 'Timing', value: timeline });

  const rows = details
    .map((row, index) =>
      serviceLinkEmailDetailRow(row.label, row.value, {
        isLast: index === details.length - 1,
      })
    )
    .join('');
  const requestRows = [
    rows,
    message && details.length > 0 ? dividerRow() : '',
    message ? messageRow(message) : '',
  ].join('');

  const sections = [
    requestRows.trim()
      ? serviceLinkEmailSection('Request', requestRows, { isFirst: true })
      : '',
    serviceLinkEmailCta(dashboardQuoteRequestUrl, 'View quote request', {
      fullWidth: true,
    }),
  ].join('');

  return wrapServiceLinkEmail({
    title: 'New quote request',
    heading: 'New quote request',
    subtitle: customerName
      ? `${customerName} sent a request from your profile.`
      : 'A customer sent a request from your profile.',
    bodyHtml: sections,
    footerHtml: `This email was sent because a customer submitted a quote request on your profile.<br>&copy; ${new Date().getFullYear()} ServiceLink.`,
  });
}
