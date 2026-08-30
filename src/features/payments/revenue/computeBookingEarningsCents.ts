import { resolveBookingLineSubtotalCents } from '@/features/availability/booking/utils/resolveBookingLineSubtotalCents';
import { isYmd } from './zonedDateTime';

export interface RevenueBookingPayment {
  total_amount_cents?: number | null;
  paid_online_amount_cents?: number | null;
  session_fees_total_cents?: number | null;
  session_payment_amount_cents?: number | null;
}

export interface RevenueBookingRow {
  status?: string | null;
  scheduled_date?: string | null;
  service_price_cents?: number | null;
  addon_details?: unknown;
  job_details?: unknown;
  subtotal_cents?: number | null;
  discount_cents?: number | null;
  booking_payments?: RevenueBookingPayment | RevenueBookingPayment[] | null;
}

export interface BookingEarningsCents {
  collectedCents: number;
  potentialCents: number;
  scheduledYmd: string;
}

export function calendarYyyyMmDdFromScheduledDate(
  value: unknown
): string | null {
  if (typeof value !== 'string') return null;
  const ymd = value.trim().slice(0, 10);
  return isYmd(ymd) ? ymd : null;
}

export function unwrapBookingPayment(
  value: RevenueBookingRow['booking_payments']
): RevenueBookingPayment | null {
  if (Array.isArray(value)) return value[0] ?? null;
  if (value && typeof value === 'object') return value;
  return null;
}

function asCents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

/**
 * Same money rules as mobile Home + Revenue (`computeBookingEarningsCents`).
 * A completed job counts as fully collected even if remaining is still open.
 */
export function computeBookingEarningsCents(
  row: RevenueBookingRow
): BookingEarningsCents | null {
  if (row.status?.trim() !== 'completed') return null;
  const scheduledYmd = calendarYyyyMmDdFromScheduledDate(row.scheduled_date);
  if (!scheduledYmd) return null;

  const payment = unwrapBookingPayment(row.booking_payments);
  const line = resolveBookingLineSubtotalCents({
    servicePriceCents: row.service_price_cents,
    addonDetails: row.addon_details,
    jobDetails: row.job_details,
  });
  const storedSubtotal = row.subtotal_cents;
  const gross =
    typeof storedSubtotal === 'number' &&
    Number.isFinite(storedSubtotal) &&
    storedSubtotal > 0
      ? Math.round(storedSubtotal)
      : line.lineSubtotalCents;
  const discount = Math.min(asCents(row.discount_cents), gross);
  const fees = asCents(payment?.session_fees_total_cents);
  const computedTotal = Math.max(gross - discount + fees, 0);
  const paymentTotal = payment?.total_amount_cents;
  const hasPaymentTotal =
    typeof paymentTotal === 'number' &&
    Number.isFinite(paymentTotal) &&
    paymentTotal >= 0;
  const needsCorrection = discount > 0 || fees > 0;
  const resolvedTotal =
    hasPaymentTotal && !needsCorrection
      ? Math.round(paymentTotal)
      : computedTotal;
  const paid =
    asCents(payment?.paid_online_amount_cents) +
    asCents(payment?.session_payment_amount_cents);
  const potentialCents = Math.max(resolvedTotal, paid);

  return {
    collectedCents: potentialCents,
    potentialCents,
    scheduledYmd,
  };
}
