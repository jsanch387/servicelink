/**
 * Attach payment summary (amount-due math) onto a mapped booking display.
 * Shared by list + single-booking PATCH responses so payment doesn't disappear.
 */

import type { AvailabilityBookingDisplay } from '../types';
import type { BookingRow } from './mapBookingRowToDisplay';
import { computeBookingAmountDue } from '../../server/computeBookingAmountDue';

export interface BookingPaymentRowInput {
  payment_status: string | null;
  payment_method_selected: string | null;
  currency: string | null;
  total_amount_cents: number | null;
  paid_online_amount_cents: number | null;
  remaining_amount_cents: number | null;
}

export function attachPaymentSummaryToDisplay(
  display: AvailabilityBookingDisplay,
  row: BookingRow,
  payment: BookingPaymentRowInput | null | undefined
): AvailabilityBookingDisplay {
  if (!payment) return display;

  const amountDue = computeBookingAmountDue({
    servicePriceCents: row.service_price_cents,
    addonDetails: row.addon_details,
    jobDetails: row.job_details,
    sessionFees: [],
    paidOnlineAmountCents: payment.paid_online_amount_cents,
    sessionPayment: undefined,
    discount: {
      discountSource: row.discount_source,
      discountType: row.discount_type,
      discountValue:
        typeof row.discount_value === 'number'
          ? row.discount_value
          : row.discount_value != null
            ? Number(row.discount_value)
            : null,
      discountCents: row.discount_cents,
    },
  });

  return {
    ...display,
    payment: {
      paymentStatus: payment.payment_status ?? 'not_required',
      paymentMethodSelected: String(payment.payment_method_selected ?? 'none'),
      currency: (payment.currency ?? 'usd').toLowerCase(),
      totalAmountCents: amountDue.adjustedTotalCents,
      paidOnlineAmountCents: amountDue.paidOnlineCents,
      remainingAmountCents: Math.max(0, amountDue.amountDueCents),
    },
  };
}
