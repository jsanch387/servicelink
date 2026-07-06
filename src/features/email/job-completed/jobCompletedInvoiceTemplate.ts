import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailFootnote,
  serviceLinkEmailParagraph,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';

export interface JobCompletedInvoiceEmailPayload {
  businessName: string;
  customerName: string;
  invoiceUrl: string;
  includeReviewHint: boolean;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  totalCents?: number;
  reviewUrl?: string | null;
}

function formatDateLong(dateStr: string): string {
  const date = new Date(`${dateStr.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr.trim();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeHHmm(timeVal: string): string {
  const trimmed = timeVal.trim().slice(0, 5);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function visitWhenLabel(
  payload: JobCompletedInvoiceEmailPayload
): string | null {
  const date = payload.scheduledDate?.trim();
  if (!date) return null;
  const time = payload.startTime?.trim();
  return time
    ? `${formatDateLong(date)} · ${formatTimeHHmm(time)}`
    : formatDateLong(date);
}

export function getJobCompletedInvoiceEmailSubject(
  businessName: string
): string {
  const name = businessName.trim() || 'your provider';
  return `Your receipt from ${name}`;
}

export function buildJobCompletedInvoiceEmailPlainText(
  payload: JobCompletedInvoiceEmailPayload
): string {
  const businessName = payload.businessName.trim() || 'your provider';
  const customerName = payload.customerName.trim() || 'there';
  const when = visitWhenLabel(payload);
  const lines = [
    'Thanks for your visit',
    '',
    `Hi ${customerName}, thanks for choosing ${businessName}. Your receipt is ready.`,
    '',
  ];

  if (payload.serviceName?.trim()) {
    lines.push('Visit summary', `— ${payload.serviceName.trim()}`);
    if (when) lines.push(`— ${when}`);
    lines.push('');
  }

  if (typeof payload.totalCents === 'number' && payload.totalCents >= 0) {
    lines.push(`Total: ${formatPriceCents(payload.totalCents)}`, '');
  }

  lines.push('View receipt:', payload.invoiceUrl);

  if (payload.includeReviewHint && payload.reviewUrl?.trim()) {
    lines.push('', 'Leave a review:', payload.reviewUrl.trim());
  }

  lines.push(
    '',
    'This link is personal to you. If you did not receive this service, you can ignore this email.',
    '',
    `You received this email because ${businessName} completed your appointment.`,
    `© ${new Date().getFullYear()} ServiceLink`
  );

  return lines.join('\n');
}

function buildReviewBlock(payload: JobCompletedInvoiceEmailPayload): string {
  if (!payload.includeReviewHint) return '';

  const reviewUrl = payload.reviewUrl?.trim();
  if (!reviewUrl) {
    return serviceLinkEmailFootnote(
      'We hope you had a great experience. Your feedback helps us keep improving.'
    );
  }

  const copyRow = `
    <tr>
      <td colspan="2" style="padding:0;">
        ${serviceLinkEmailParagraph('If you have a moment, we would love to hear how your visit went.')}
      </td>
    </tr>
  `.trim();

  return `
    ${serviceLinkEmailSection('Enjoyed your visit?', copyRow, { isFirst: false })}
    ${serviceLinkEmailCta(reviewUrl, 'Leave a review')}
  `.trim();
}

export function buildJobCompletedInvoiceEmailHtml(
  payload: JobCompletedInvoiceEmailPayload
): string {
  const businessName = payload.businessName.trim() || 'your provider';
  const customerName = payload.customerName.trim() || 'there';
  const when = visitWhenLabel(payload);
  const year = new Date().getFullYear();

  const summaryRows: string[] = [];
  if (payload.serviceName?.trim()) {
    summaryRows.push(
      serviceLinkEmailDetailRow('Service', payload.serviceName.trim(), {
        isLast: !when && typeof payload.totalCents !== 'number',
      })
    );
  }
  if (when) {
    summaryRows.push(
      serviceLinkEmailDetailRow('When', when, {
        isLast: typeof payload.totalCents !== 'number',
      })
    );
  }
  if (typeof payload.totalCents === 'number' && payload.totalCents >= 0) {
    summaryRows.push(
      serviceLinkEmailDetailRow('Total', formatPriceCents(payload.totalCents), {
        isLast: true,
      })
    );
  }

  const summarySection =
    summaryRows.length > 0
      ? serviceLinkEmailSection('Visit summary', summaryRows.join(''), {
          isFirst: true,
        })
      : '';

  const bodyHtml = [
    summarySection,
    serviceLinkEmailCta(payload.invoiceUrl, 'View receipt'),
    buildReviewBlock(payload),
    serviceLinkEmailFootnote(
      'This link is personal to you. If you did not receive this service, you can ignore this email.'
    ),
  ]
    .filter(Boolean)
    .join('');

  return wrapServiceLinkEmail({
    title: 'Your receipt',
    heading: 'Thanks for your visit',
    subtitle: `Hi ${customerName}, thanks for choosing ${businessName}. Your receipt is ready to view online.`,
    bodyHtml,
    footerHtml: `You received this email because ${businessName} completed your appointment.<br>&copy; ${year} ServiceLink.`,
  });
}
