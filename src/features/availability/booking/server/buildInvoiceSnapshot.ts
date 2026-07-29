import {
  getPublicInvoicePath,
  getPublicReviewPath,
  getPublicBusinessProfilePath,
} from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import type { BookingAmountDueResult } from './computeBookingAmountDue';
import {
  formatJobVehicleLine,
  parseStoredBookingJobDetails,
} from '../utils/parseStoredBookingJobDetails';
import { parseStoredBookingServiceName } from '../utils/parseStoredBookingServiceName';

export interface InvoiceSnapshotLine {
  kind: 'service' | 'addon' | 'session_fee' | 'discount';
  label: string;
  /**
   * For service/addon/session_fee: charge amount.
   * For discount: reduction amount (positive); UI renders as −$X.XX.
   */
  amountCents: number;
  /** Pricing option label when the customer picked a multi-price variant. */
  detailLabel?: string | null;
}

export interface InvoiceSnapshotPayment {
  kind: 'online' | 'session';
  label: string;
  method?: string;
  amountCents: number;
}

/** One job on a multi-job appointment receipt (from `job_details`). */
export interface InvoiceSnapshotJob {
  serviceName: string;
  /** Pricing option — omit/null when the service has none. */
  servicePriceOptionLabel: string | null;
  servicePriceCents: number;
  durationMinutes: number;
  /** Display line e.g. "2016 Chevy Cruze" — null when no vehicle. */
  vehicleLabel: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  addOns: Array<{ name: string; priceCents: number }>;
}

export interface BookingInvoiceSnapshot {
  version: 1;
  issuedAt: string;
  business: {
    id: string;
    name: string;
    /** Public booking profile — customer contacts the business, not ServiceLink. */
    profileUrl: string | null;
  };
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  booking: {
    id: string;
    serviceName: string;
    servicePriceOptionLabel: string | null;
    scheduledDate: string;
    startTime: string;
  };
  /**
   * Multi-job line items when the booking stored `job_details`.
   * Older snapshots omit this — UI falls back to `lines`.
   */
  jobs?: InvoiceSnapshotJob[];
  lines: InvoiceSnapshotLine[];
  payments: InvoiceSnapshotPayment[];
  totals: {
    /** Service + add-ons + session fees (pre-discount). */
    subtotalCents: number;
    /**
     * Sale/promo reduction (0 when none). Optional on older stored snapshots.
     */
    discountCents?: number;
    paidCents: number;
    /** Amount charged after discount. */
    totalCents: number;
  };
  reviewUrl: string | null;
}

interface BuildInvoiceSnapshotInput {
  business: {
    id: string;
    name: string;
    businessSlug?: string | null;
    businessLink?: string | null;
  };
  booking: {
    id: string;
    service_name: string;
    scheduled_date: string;
    start_time: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    service_price_cents: number | null;
    addon_details: unknown;
    /** Customer-facing sale/promo label from booking snapshot. */
    discount_label?: string | null;
    /** Multi-job appointment line items. */
    job_details?: unknown | null;
  };
  sessionFees: JobCompletedSessionFeeInput[];
  amountDue: BookingAmountDueResult;
  sessionPaymentMethod?: string;
  reviewRawToken?: string | null;
}

function addonLines(addonDetails: unknown): InvoiceSnapshotLine[] {
  if (!Array.isArray(addonDetails)) return [];
  return addonDetails.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const name = String((item as { name?: string }).name ?? '').trim();
    const cents = (item as { priceCents?: number }).priceCents;
    if (!name || typeof cents !== 'number' || cents < 0) return [];
    return [{ kind: 'addon' as const, label: name, amountCents: cents }];
  });
}

function buildJobSnapshotParts(jobDetailsRaw: unknown): {
  jobs: InvoiceSnapshotJob[];
  lines: InvoiceSnapshotLine[];
} {
  const parsed = parseStoredBookingJobDetails(jobDetailsRaw);
  if (parsed.length === 0) return { jobs: [], lines: [] };

  const jobs: InvoiceSnapshotJob[] = [];
  const lines: InvoiceSnapshotLine[] = [];

  for (const job of parsed) {
    const option = job.servicePriceOptionLabel?.trim() || null;
    jobs.push({
      serviceName: job.serviceName,
      servicePriceOptionLabel: option,
      servicePriceCents: job.servicePriceCents,
      durationMinutes: job.durationMinutes,
      vehicleLabel: formatJobVehicleLine(job.vehicle),
      vehicleYear: job.vehicle?.year?.trim() || null,
      vehicleMake: job.vehicle?.make?.trim() || null,
      vehicleModel: job.vehicle?.model?.trim() || null,
      addOns: job.selectedAddOns.map(a => ({
        name: a.name,
        priceCents: a.priceCents,
      })),
    });

    lines.push({
      kind: 'service',
      label: job.serviceName,
      detailLabel: option,
      amountCents: job.servicePriceCents,
    });
    for (const addOn of job.selectedAddOns) {
      lines.push({
        kind: 'addon',
        label: addOn.name,
        amountCents: addOn.priceCents,
      });
    }
  }

  return { jobs, lines };
}

export function resolveBusinessProfileUrl(input: {
  businessLink?: string | null;
  businessSlug?: string | null;
}): string | null {
  const storedLink = input.businessLink?.trim();
  if (storedLink) {
    return /^https?:\/\//i.test(storedLink)
      ? storedLink
      : `https://${storedLink.replace(/^\/+/, '')}`;
  }

  const slug = input.businessSlug?.trim();
  if (!slug) return null;

  return `${getAppBaseUrl()}${getPublicBusinessProfilePath(slug)}`;
}

/** Display label for footer links, e.g. `myservicelink.app/black-label-detail`. */
export function formatBusinessProfileLinkLabel(profileUrl: string): string {
  return profileUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

export function buildInvoiceSnapshot(
  input: BuildInvoiceSnapshotInput
): BookingInvoiceSnapshot {
  const parsedService = parseStoredBookingServiceName(
    input.booking.service_name ?? ''
  );
  const jobParts = buildJobSnapshotParts(input.booking.job_details);
  const lines: InvoiceSnapshotLine[] = [];

  if (jobParts.jobs.length > 0) {
    lines.push(...jobParts.lines);
  } else {
    const serviceCents = input.amountDue.serviceCents;
    if (serviceCents > 0) {
      lines.push({
        kind: 'service',
        label: parsedService.serviceName || 'Service',
        detailLabel: parsedService.priceOptionLabel,
        amountCents: serviceCents,
      });
    }
    lines.push(...addonLines(input.booking.addon_details));
  }

  for (const fee of input.sessionFees) {
    lines.push({
      kind: 'session_fee',
      label: fee.label,
      amountCents: fee.amountCents,
    });
  }

  const discountCents =
    typeof input.amountDue.discountCents === 'number' &&
    Number.isFinite(input.amountDue.discountCents) &&
    input.amountDue.discountCents > 0
      ? Math.round(input.amountDue.discountCents)
      : 0;
  if (discountCents > 0) {
    const discountLabel = input.booking.discount_label?.trim() || 'Discount';
    lines.push({
      kind: 'discount',
      label: discountLabel,
      amountCents: discountCents,
    });
  }

  const payments: InvoiceSnapshotPayment[] = [];
  if (input.amountDue.paidOnlineCents > 0) {
    payments.push({
      kind: 'online',
      label: 'Paid online',
      amountCents: input.amountDue.paidOnlineCents,
    });
  }
  if (input.amountDue.sessionPayCents > 0) {
    payments.push({
      kind: 'session',
      label: 'Paid at visit',
      method: input.sessionPaymentMethod,
      amountCents: input.amountDue.sessionPayCents,
    });
  }

  const paidCents =
    input.amountDue.paidOnlineCents + input.amountDue.sessionPayCents;
  const reviewUrl = input.reviewRawToken
    ? `${getAppBaseUrl()}${getPublicReviewPath(input.reviewRawToken)}`
    : null;
  const profileUrl = resolveBusinessProfileUrl({
    businessLink: input.business.businessLink,
    businessSlug: input.business.businessSlug,
  });

  const snapshot: BookingInvoiceSnapshot = {
    version: 1,
    issuedAt: new Date().toISOString(),
    business: {
      id: input.business.id,
      name: input.business.name,
      profileUrl,
    },
    customer: {
      name: input.booking.customer_name?.trim() || 'Customer',
      email: input.booking.customer_email?.trim() || null,
      phone: input.booking.customer_phone?.trim() || null,
    },
    booking: {
      id: input.booking.id,
      serviceName:
        jobParts.jobs.length > 1
          ? `${jobParts.jobs.length} jobs`
          : parsedService.serviceName || 'Service',
      servicePriceOptionLabel:
        jobParts.jobs.length > 1
          ? null
          : (jobParts.jobs[0]?.servicePriceOptionLabel ??
            parsedService.priceOptionLabel),
      scheduledDate: input.booking.scheduled_date,
      startTime: String(input.booking.start_time ?? '').trim(),
    },
    lines,
    payments,
    totals: {
      subtotalCents: input.amountDue.subtotalCents,
      discountCents,
      paidCents,
      totalCents: input.amountDue.adjustedTotalCents,
    },
    reviewUrl,
  };

  if (jobParts.jobs.length > 0) {
    snapshot.jobs = jobParts.jobs;
  }

  return snapshot;
}

export function buildPublicInvoiceUrl(publicToken: string): string {
  return `${getAppBaseUrl()}${getPublicInvoicePath(publicToken)}`;
}
