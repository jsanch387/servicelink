/**
 * Server source of truth for Complete-sheet amount due.
 * Must match mobile math in BookingCompleteInvoiceDesignSheet.jsx.
 *
 * Discount (promo/sale snapshot) applies to service + add-ons only.
 * Session fees are full price. Deposits/paid online stay pre-discount.
 */

import type { DiscountType } from '@/features/marketing/types';
import { applyDiscountToSubtotalCents } from '@/features/marketing/utils/applyDiscountToSubtotalCents';
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

export interface BookingDiscountSnapshotInput {
  discountSource?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  /** Fallback when type/value missing. */
  discountCents?: number | null;
}

export interface BookingAmountDueInput {
  servicePriceCents: number | null | undefined;
  addonDetails: unknown;
  sessionFees: JobCompletedSessionFeeInput[];
  paidOnlineAmountCents: number | null | undefined;
  sessionPayment: JobCompletedSessionPaymentInput | undefined;
  /** Optional booking discount snapshot (promo/sale). */
  discount?: BookingDiscountSnapshotInput | null;
}

export interface BookingAmountDueResult {
  serviceCents: number;
  addonCents: number;
  sessionFeeCents: number;
  /** Service + add-ons + session fees (pre-discount). */
  subtotalCents: number;
  /** Discount applied to service + add-ons only. */
  discountCents: number;
  /** subtotal − discount (never below session fees floor). */
  adjustedTotalCents: number;
  paidOnlineCents: number;
  sessionPayCents: number;
  amountDueCents: number;
}

function resolveLineDiscountCents(
  lineSubtotalCents: number,
  discount: BookingDiscountSnapshotInput | null | undefined
): number {
  if (!discount) return 0;
  const source = discount.discountSource?.trim();
  if (source !== 'promo' && source !== 'sale') return 0;

  const type = discount.discountType;
  const value = discount.discountValue;
  if (
    (type === 'percentage' || type === 'fixed_amount') &&
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return applyDiscountToSubtotalCents(
      lineSubtotalCents,
      type as DiscountType,
      value
    ).discountCents;
  }

  if (
    typeof discount.discountCents === 'number' &&
    Number.isFinite(discount.discountCents) &&
    discount.discountCents > 0
  ) {
    return Math.min(lineSubtotalCents, Math.round(discount.discountCents));
  }

  return 0;
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
  const lineSubtotalCents = serviceCents + addonCents;
  const discountCents = resolveLineDiscountCents(
    lineSubtotalCents,
    input.discount
  );
  const subtotalCents = lineSubtotalCents + sessionFeeCents;
  const adjustedTotalCents = Math.max(
    sessionFeeCents,
    subtotalCents - discountCents
  );
  const paidOnlineCents =
    typeof input.paidOnlineAmountCents === 'number' &&
    input.paidOnlineAmountCents >= 0
      ? input.paidOnlineAmountCents
      : 0;
  const sessionPayCents = input.sessionPayment?.amountCents ?? 0;
  const amountDueCents = adjustedTotalCents - paidOnlineCents - sessionPayCents;

  return {
    serviceCents,
    addonCents,
    sessionFeeCents,
    subtotalCents,
    discountCents,
    adjustedTotalCents,
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
