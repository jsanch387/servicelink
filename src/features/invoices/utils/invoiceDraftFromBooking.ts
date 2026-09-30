import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import { parseStoredBookingJobDetails } from '@/features/availability/booking/utils/parseStoredBookingJobDetails';

import type { InvoiceDraft, InvoiceLineDraft } from '../types';
import { centsToInvoiceAmountInput, createInvoiceLine } from './invoiceDraft';

const DESCRIPTION_MAX = 200;

export type BookingInvoiceSource = {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceName: string | null;
  servicePriceCents: number | null;
  addonDetails: unknown;
  jobDetails: unknown;
  discountCents: number | null;
  discountLabel: string | null;
};

type PricedLine = {
  description: string;
  unitAmountCents: number;
};

function clip(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > DESCRIPTION_MAX
    ? trimmed.slice(0, DESCRIPTION_MAX).trim()
    : trimmed;
}

function pushPriced(lines: PricedLine[], description: string, cents: number) {
  const name = clip(description);
  if (!name) return;
  const amount = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  if (amount <= 0 && lines.some(line => line.unitAmountCents > 0)) return;
  lines.push({ description: name, unitAmountCents: amount });
}

function serviceLabel(name: string, option: string | null): string {
  const optionLabel = option?.trim() ?? '';
  return optionLabel ? `${name} (${optionLabel})` : name;
}

function linesFromJobs(jobDetails: unknown): PricedLine[] {
  const jobs = parseStoredBookingJobDetails(jobDetails);
  const lines: PricedLine[] = [];
  for (const job of jobs) {
    pushPriced(
      lines,
      serviceLabel(job.serviceName, job.servicePriceOptionLabel),
      job.servicePriceCents
    );
    for (const addon of job.selectedAddOns) {
      pushPriced(lines, addon.name, addon.priceCents);
    }
  }
  return lines;
}

function linesFromLegacy(source: BookingInvoiceSource): PricedLine[] {
  const lines: PricedLine[] = [];
  pushPriced(lines, source.serviceName ?? '', source.servicePriceCents ?? 0);
  if (!Array.isArray(source.addonDetails)) return lines;
  for (const addon of source.addonDetails) {
    if (!addon || typeof addon !== 'object') continue;
    const row = addon as { name?: unknown; priceCents?: unknown };
    const name = typeof row.name === 'string' ? row.name : '';
    const cents =
      typeof row.priceCents === 'number' && Number.isFinite(row.priceCents)
        ? row.priceCents
        : 0;
    pushPriced(lines, name, cents);
  }
  return lines;
}

/** Takes the appointment discount off the last lines so the bill matches what was charged. */
function applyDiscount(
  lines: PricedLine[],
  discountCents: number
): PricedLine[] {
  let remaining = Math.max(0, Math.round(discountCents));
  const next = lines.map(line => ({ ...line }));
  for (let index = next.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const take = Math.min(remaining, next[index].unitAmountCents);
    next[index].unitAmountCents -= take;
    remaining -= take;
  }
  const priced = next.filter(line => line.unitAmountCents > 0);
  return priced.length > 0 ? priced : next.filter(line => line.description);
}

function toDraftLine(line: PricedLine, index: number): InvoiceLineDraft {
  return {
    id: `booking-line-${index + 1}`,
    description: line.description,
    quantity: '1',
    amount:
      line.unitAmountCents > 0
        ? centsToInvoiceAmountInput(line.unitAmountCents)
        : '',
  };
}

/**
 * Customer and work from an appointment, ready for the New invoice form.
 * Due date stays empty. Shop notes on the booking are not copied onto the bill.
 */
export function invoiceDraftFromBooking(
  source: BookingInvoiceSource
): InvoiceDraft {
  const fromJobs = linesFromJobs(source.jobDetails);
  const priced = applyDiscount(
    fromJobs.length > 0 ? fromJobs : linesFromLegacy(source),
    source.discountCents ?? 0
  );
  const discountLabel = source.discountLabel?.trim() ?? '';
  const lines =
    priced.length > 0
      ? priced.map(toDraftLine)
      : [createInvoiceLine('booking-line-1')];

  return {
    customerName: source.customerName?.trim().replace(/\s+/g, ' ') ?? '',
    customerPhone: normalizeUsPhoneDigits(source.customerPhone ?? ''),
    customerEmail: source.customerEmail?.trim().toLowerCase() ?? '',
    dueDate: '',
    note: (source.discountCents ?? 0) > 0 && discountLabel ? discountLabel : '',
    lines,
  };
}
