/**
 * Server source of truth for Complete-sheet amount due.
 * Must match mobile math in BookingCompleteInvoiceDesignSheet.jsx.
 */

import type {
  JobCompletedSessionFeeInput,
  JobCompletedSessionPaymentInput,
} from './jobCompletedTypes';

export interface AddonDetailLine {
  priceCents?: number | null;
}

export function sumAddonDetailsCents(addonDetails: unknown): number {
  if (!Array.isArray(addonDetails)) return 0;
  return addonDetails.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const cents = (item as AddonDetailLine).priceCents;
    return sum + (typeof cents === 'number' && cents >= 0 ? cents : 0);
  }, 0);
}

export function sumSessionFeesCents(
  sessionFees: JobCompletedSessionFeeInput[]
): number {
  return sessionFees.reduce((sum, fee) => sum + fee.amountCents, 0);
}

export interface BookingAmountDueInput {
  servicePriceCents: number | null | undefined;
  addonDetails: unknown;
  sessionFees: JobCompletedSessionFeeInput[];
  paidOnlineAmountCents: number | null | undefined;
  sessionPayment: JobCompletedSessionPaymentInput | undefined;
}

export interface BookingAmountDueResult {
  serviceCents: number;
  addonCents: number;
  sessionFeeCents: number;
  subtotalCents: number;
  paidOnlineCents: number;
  sessionPayCents: number;
  amountDueCents: number;
}

export function computeBookingAmountDue(
  input: BookingAmountDueInput
): BookingAmountDueResult {
  const serviceCents =
    typeof input.servicePriceCents === 'number' && input.servicePriceCents >= 0
      ? input.servicePriceCents
      : 0;
  const addonCents = sumAddonDetailsCents(input.addonDetails);
  const sessionFeeCents = sumSessionFeesCents(input.sessionFees);
  const subtotalCents = serviceCents + addonCents + sessionFeeCents;
  const paidOnlineCents =
    typeof input.paidOnlineAmountCents === 'number' &&
    input.paidOnlineAmountCents >= 0
      ? input.paidOnlineAmountCents
      : 0;
  const sessionPayCents = input.sessionPayment?.amountCents ?? 0;
  const amountDueCents = subtotalCents - paidOnlineCents - sessionPayCents;

  return {
    serviceCents,
    addonCents,
    sessionFeeCents,
    subtotalCents,
    paidOnlineCents,
    sessionPayCents,
    amountDueCents,
  };
}

/** Matches `booking_payments_remaining_consistency` after Phase 1 session columns. */
export function computeBookingRemainingAmountCents(input: {
  totalAmountCents: number;
  paidOnlineCents: number;
  sessionPayCents: number;
}): number {
  return Math.max(
    input.totalAmountCents - input.paidOnlineCents - input.sessionPayCents,
    0
  );
}
