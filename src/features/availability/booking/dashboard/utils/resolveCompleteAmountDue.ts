import type { AvailabilityBookingDisplay } from '../types';

/**
 * Amount still owed when completing on web.
 * Prefers list API payment summary; falls back to line items − discount.
 */
export function resolveCompleteAmountDueCents(
  booking: AvailabilityBookingDisplay
): number {
  if (booking.payment) {
    return Math.max(0, Math.round(booking.payment.remainingAmountCents));
  }

  const jobs = booking.jobs ?? [];
  let lineCents = 0;
  if (jobs.length > 0) {
    lineCents = jobs.reduce(
      (sum, job) =>
        sum +
        job.servicePriceCents +
        job.selectedAddOns.reduce((s, a) => s + a.priceCents, 0),
      0
    );
  } else {
    lineCents =
      (booking.servicePriceCents ?? 0) +
      (booking.addonDetails ?? []).reduce((s, a) => s + a.priceCents, 0);
  }

  const discountCents = booking.discount?.discountCents ?? 0;
  return Math.max(0, Math.round(lineCents - discountCents));
}

export function resolveCompleteCurrency(
  booking: AvailabilityBookingDisplay
): string {
  return (booking.payment?.currency || 'usd').toLowerCase();
}
