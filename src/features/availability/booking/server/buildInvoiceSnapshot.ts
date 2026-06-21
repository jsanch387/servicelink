import {
  getPublicInvoicePath,
  getPublicReviewPath,
  getPublicBusinessProfilePath,
} from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import type { BookingAmountDueResult } from './computeBookingAmountDue';
import { parseStoredBookingServiceName } from '../utils/parseStoredBookingServiceName';

export interface InvoiceSnapshotLine {
  kind: 'service' | 'addon' | 'session_fee';
  label: string;
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
  lines: InvoiceSnapshotLine[];
  payments: InvoiceSnapshotPayment[];
  totals: {
    subtotalCents: number;
    paidCents: number;
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
  const serviceCents = input.amountDue.serviceCents;
  const lines: InvoiceSnapshotLine[] = [];

  if (serviceCents > 0) {
    lines.push({
      kind: 'service',
      label: parsedService.serviceName || 'Service',
      detailLabel: parsedService.priceOptionLabel,
      amountCents: serviceCents,
    });
  }

  lines.push(...addonLines(input.booking.addon_details));

  for (const fee of input.sessionFees) {
    lines.push({
      kind: 'session_fee',
      label: fee.label,
      amountCents: fee.amountCents,
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

  return {
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
      serviceName: parsedService.serviceName || 'Service',
      servicePriceOptionLabel: parsedService.priceOptionLabel,
      scheduledDate: input.booking.scheduled_date,
      startTime: String(input.booking.start_time ?? '').trim(),
    },
    lines,
    payments,
    totals: {
      subtotalCents: input.amountDue.subtotalCents,
      paidCents,
      totalCents: input.amountDue.subtotalCents,
    },
    reviewUrl,
  };
}

export function buildPublicInvoiceUrl(publicToken: string): string {
  return `${getAppBaseUrl()}${getPublicInvoicePath(publicToken)}`;
}
