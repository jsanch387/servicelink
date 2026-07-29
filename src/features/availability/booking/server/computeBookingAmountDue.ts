/**
 * Server source of truth for Complete-sheet amount due.
 * Must match mobile math in BookingCompleteInvoiceDesignSheet.jsx.
 *
 * Discount (promo/sale snapshot) applies to service + add-ons only.
 * Session fees are full price. Deposits/paid online stay pre-discount.
 *
 * Money rules:
 * 1. Line items from `job_details` when present (else top-level service + addons)
 * 2. Frozen `discount_cents` on the booking wins over recomputing %
 * 3. amountDue = line + fees − discount − paidOnline − sessionPayment
 */

import type { DiscountType } from '@/features/marketing/types';
import { applyDiscountToSubtotalCents } from '@/features/marketing/utils/applyDiscountToSubtotalCents';
import {
  resolveBookingLineSubtotalCents,
  sumTopLevelAddonDetailsCents,
} from '../utils/resolveBookingLineSubtotalCents';
import type {
  JobCompletedSessionFeeInput,
  JobCompletedSessionPaymentInput,
} from './jobCompletedTypes';

export interface AddonDetailLine {
  priceCents?: number | null;
}

/** @deprecated Prefer sumTopLevelAddonDetailsCents — kept for existing imports. */
export function sumAddonDetailsCents(addonDetails: unknown): number {
  return sumTopLevelAddonDetailsCents(addonDetails);
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
  /**
   * Multi-job `job_details` — source of truth for service + add-on line items
   * when present.
   */
  jobDetails?: unknown;
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

  // Frozen booking snapshot wins. Mobile Complete sheet shows discount_cents
  // from the row; recomputing % on a drifted line total causes mismatches.
  if (
    typeof discount.discountCents === 'number' &&
    Number.isFinite(discount.discountCents) &&
    discount.discountCents > 0
  ) {
    return Math.min(lineSubtotalCents, Math.round(discount.discountCents));
  }

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

  return 0;
}

export function computeBookingAmountDue(
  input: BookingAmountDueInput
): BookingAmountDueResult {
  const line = resolveBookingLineSubtotalCents({
    servicePriceCents: input.servicePriceCents,
    addonDetails: input.addonDetails,
    jobDetails: input.jobDetails,
  });
  const serviceCents = line.serviceCents;
  const addonCents = line.addonCents;

  const sessionFeeCents = sumSessionFeesCents(input.sessionFees);
  const lineSubtotalCents = line.lineSubtotalCents;
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
