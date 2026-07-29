import {
  buildEmailJobsReceiptCardHtml,
  type EmailJobsReceiptJob,
} from '../utils/emailJobsReceiptCard';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailDiscountLineRow,
  serviceLinkEmailFootnote,
  serviceLinkEmailParagraph,
  serviceLinkEmailPriceLineRow,
  serviceLinkEmailPriceTotalRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';

export interface JobCompletedInvoiceEmailJob {
  serviceName: string;
  servicePriceOptionLabel?: string | null;
  servicePriceCents?: number | null;
  selectedAddOns?: Array<{ name: string; priceCents: number }>;
  durationMinutes?: number | null;
  customerVehicleYear?: string | null;
  customerVehicleMake?: string | null;
  customerVehicleModel?: string | null;
}

export interface JobCompletedInvoiceEmailPayload {
  businessName: string;
  customerName: string;
  invoiceUrl: string;
  includeReviewHint: boolean;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  /** Final amount charged (after sale/promo). */
  totalCents?: number;
  /** Pre-discount subtotal (service + add-ons + session fees). */
  subtotalCents?: number;
  /** Frozen sale/promo from the booking — shown so line math adds up. */
  discount?: {
    label: string;
    discountCents: number;
  } | null;
  reviewUrl?: string | null;
  /** Multi-job appointment line items from `job_details`. */
  jobs?: JobCompletedInvoiceEmailJob[];
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

function hasJobs(
  payload: JobCompletedInvoiceEmailPayload
): payload is JobCompletedInvoiceEmailPayload & {
  jobs: JobCompletedInvoiceEmailJob[];
} {
  return Array.isArray(payload.jobs) && payload.jobs.length > 0;
}

function jobsGrossCents(jobs: JobCompletedInvoiceEmailJob[]): number {
  return jobs.reduce((sum, job) => {
    const service =
      job.servicePriceCents != null && Number.isFinite(job.servicePriceCents)
        ? job.servicePriceCents
        : 0;
    const addOns = (job.selectedAddOns ?? []).reduce(
      (s, a) => s + a.priceCents,
      0
    );
    return sum + service + addOns;
  }, 0);
}

function resolvePricing(payload: JobCompletedInvoiceEmailPayload): {
  subtotalCents: number | null;
  discount: { label: string; discountCents: number } | null;
  totalCents: number | null;
} {
  const discount =
    payload.discount != null &&
    payload.discount.discountCents > 0 &&
    payload.discount.label.trim()
      ? {
          label: payload.discount.label.trim(),
          discountCents: payload.discount.discountCents,
        }
      : null;

  const totalCents =
    typeof payload.totalCents === 'number' && payload.totalCents >= 0
      ? payload.totalCents
      : null;

  let subtotalCents =
    typeof payload.subtotalCents === 'number' && payload.subtotalCents >= 0
      ? payload.subtotalCents
      : null;

  if (subtotalCents == null && hasJobs(payload)) {
    const gross = jobsGrossCents(payload.jobs);
    if (gross > 0) subtotalCents = gross;
  }

  if (subtotalCents == null && totalCents != null && discount != null) {
    subtotalCents = totalCents + discount.discountCents;
  }

  return { subtotalCents, discount, totalCents };
}

function buildPricingRowsHtml(
  payload: JobCompletedInvoiceEmailPayload
): string {
  const { subtotalCents, discount, totalCents } = resolvePricing(payload);
  if (totalCents == null && subtotalCents == null) return '';

  const rows: string[] = [];
  if (subtotalCents != null && discount) {
    rows.push(
      serviceLinkEmailPriceLineRow('Subtotal', formatPriceCents(subtotalCents))
    );
    rows.push(
      serviceLinkEmailDiscountLineRow(
        discount.label,
        `-${formatPriceCents(discount.discountCents)}`
      )
    );
    if (totalCents != null) {
      rows.push(
        serviceLinkEmailPriceTotalRow('Total', formatPriceCents(totalCents))
      );
    }
  } else if (totalCents != null) {
    rows.push(
      serviceLinkEmailPriceTotalRow('Total', formatPriceCents(totalCents))
    );
  } else if (subtotalCents != null) {
    rows.push(
      serviceLinkEmailPriceTotalRow('Total', formatPriceCents(subtotalCents))
    );
  }
  return rows.join('');
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
  const pricing = resolvePricing(payload);
  const lines = [
    'Thanks for your visit',
    '',
    `Hi ${customerName}, thanks for choosing ${businessName}. Your receipt is ready.`,
    '',
  ];

  if (hasJobs(payload)) {
    lines.push('Jobs');
    for (const job of payload.jobs) {
      const option = job.servicePriceOptionLabel?.trim();
      const serviceLabel = option
        ? `${job.serviceName.trim()} (${option})`
        : job.serviceName.trim();
      const serviceCents =
        job.servicePriceCents != null && Number.isFinite(job.servicePriceCents)
          ? formatPriceCents(job.servicePriceCents)
          : null;
      lines.push(
        serviceCents
          ? `— ${serviceLabel}: ${serviceCents}`
          : `— ${serviceLabel}`
      );
      for (const addOn of job.selectedAddOns ?? []) {
        lines.push(`  · ${addOn.name}: ${formatPriceCents(addOn.priceCents)}`);
      }
    }
    lines.push('');
    if (when) lines.push(`When: ${when}`, '');
  } else if (payload.serviceName?.trim()) {
    lines.push('Visit summary', `— ${payload.serviceName.trim()}`);
    if (when) lines.push(`— ${when}`);
    lines.push('');
  } else if (when) {
    lines.push(`When: ${when}`, '');
  }

  if (pricing.subtotalCents != null && pricing.discount) {
    lines.push(`Subtotal: ${formatPriceCents(pricing.subtotalCents)}`);
    lines.push(
      `${pricing.discount.label}: -${formatPriceCents(pricing.discount.discountCents)}`
    );
  }
  if (pricing.totalCents != null) {
    lines.push(`Total: ${formatPriceCents(pricing.totalCents)}`, '');
  } else if (pricing.subtotalCents != null && !pricing.discount) {
    lines.push(`Total: ${formatPriceCents(pricing.subtotalCents)}`, '');
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

function toEmailJobs(
  jobs: JobCompletedInvoiceEmailJob[]
): EmailJobsReceiptJob[] {
  return jobs.map(job => ({
    serviceName: job.serviceName,
    servicePriceOptionLabel: job.servicePriceOptionLabel,
    servicePriceCents: job.servicePriceCents,
    selectedAddOns: job.selectedAddOns,
    durationMinutes: job.durationMinutes,
    customerVehicleYear: job.customerVehicleYear,
    customerVehicleMake: job.customerVehicleMake,
    customerVehicleModel: job.customerVehicleModel,
  }));
}

export function buildJobCompletedInvoiceEmailHtml(
  payload: JobCompletedInvoiceEmailPayload
): string {
  const businessName = payload.businessName.trim() || 'your provider';
  const customerName = payload.customerName.trim() || 'there';
  const when = visitWhenLabel(payload);
  const year = new Date().getFullYear();
  const multiJob = hasJobs(payload);
  const pricingHtml = buildPricingRowsHtml(payload);
  const hasPricingSection = Boolean(pricingHtml.trim());

  const sectionParts: string[] = [];
  let sectionCount = 0;
  const addSection = (title: string, rowsHtml: string) => {
    if (!rowsHtml.trim()) return;
    sectionParts.push(
      serviceLinkEmailSection(title, rowsHtml, {
        isFirst: sectionCount === 0,
      })
    );
    sectionCount += 1;
  };

  if (multiJob) {
    if (when) {
      addSection(
        'Visit summary',
        serviceLinkEmailDetailRow('When', when, { isLast: true })
      );
    }
    addSection(
      'Jobs',
      buildEmailJobsReceiptCardHtml(toEmailJobs(payload.jobs))
    );
    if (hasPricingSection) {
      addSection('Pricing', pricingHtml);
    }
  } else {
    const summaryRows: string[] = [];
    if (payload.serviceName?.trim()) {
      summaryRows.push(
        serviceLinkEmailDetailRow('Service', payload.serviceName.trim(), {
          isLast: !when && !hasPricingSection,
        })
      );
    }
    if (when) {
      summaryRows.push(
        serviceLinkEmailDetailRow('When', when, {
          isLast: !hasPricingSection,
        })
      );
    }
    if (summaryRows.length > 0) {
      addSection('Visit summary', summaryRows.join(''));
    }
    if (hasPricingSection) {
      addSection('Pricing', pricingHtml);
    }
  }

  const bodyHtml = [
    ...sectionParts,
    serviceLinkEmailCta(payload.invoiceUrl, 'View receipt'),
    buildReviewBlock(payload),
    serviceLinkEmailFootnote(
      'This link is personal to you. If you did not receive this service, you can ignore this email.'
    ),
  ]
    .filter(Boolean)
    .join('');

  const jobCount = multiJob ? payload.jobs.length : 0;
  const subtitle = multiJob
    ? `Hi ${customerName}, thanks for choosing ${businessName}. Your receipt for ${jobCount} jobs is ready to view online.`
    : `Hi ${customerName}, thanks for choosing ${businessName}. Your receipt is ready to view online.`;

  return wrapServiceLinkEmail({
    title: 'Your receipt',
    heading: 'Thanks for your visit',
    subtitle,
    bodyHtml,
    footerHtml: `You received this email because ${businessName} completed your appointment.<br>&copy; ${year} ServiceLink.`,
  });
}
