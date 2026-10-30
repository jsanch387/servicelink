/**
 * After a reschedule changes the sale or promo, rewrite the frozen tax so it
 * matches the price after that discount. The rate stays the one already saved
 * on the payment row.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeBookingAmountDue } from './computeBookingAmountDue';

export async function syncBookingPaymentTaxAfterDiscount(
  booking: BookingRow,
  supabase: SupabaseClient = createSupabaseAdminClient()
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('booking_payments')
    .select(
      'id, tax_cents, tax_rate_bps, paid_online_amount_cents, total_amount_cents, remaining_amount_cents'
    )
    .eq('booking_id', booking.id)
    .eq('business_id', booking.business_id)
    .maybeSingle();

  if (error || !data?.id) return;

  const row = data as {
    id: string;
    tax_cents?: number | null;
    tax_rate_bps?: number | null;
    paid_online_amount_cents?: number | null;
    total_amount_cents?: number | null;
    remaining_amount_cents?: number | null;
  };
  const rate =
    typeof row.tax_rate_bps === 'number' && row.tax_rate_bps > 0
      ? row.tax_rate_bps
      : 0;
  if (rate <= 0) return;

  const due = computeBookingAmountDue({
    servicePriceCents: booking.service_price_cents,
    addonDetails: booking.addon_details,
    jobDetails: booking.job_details,
    sessionFees: [],
    paidOnlineAmountCents: row.paid_online_amount_cents,
    discount: {
      discountSource: booking.discount_source,
      discountType: booking.discount_type,
      discountValue:
        typeof booking.discount_value === 'number'
          ? booking.discount_value
          : booking.discount_value != null
            ? Number(booking.discount_value)
            : null,
      discountCents: booking.discount_cents,
    },
    taxCents: row.tax_cents,
    taxRateBps: rate,
  });
  const remaining = Math.max(0, due.amountDueCents);
  if (
    due.taxCents === (row.tax_cents ?? 0) &&
    due.adjustedTotalCents === (row.total_amount_cents ?? 0) &&
    remaining === (row.remaining_amount_cents ?? 0)
  ) {
    return;
  }

  const { error: updateError } = await db
    .from('booking_payments')
    .update({
      tax_cents: due.taxCents,
      tax_rate_bps: due.taxRateBps,
      total_amount_cents: due.adjustedTotalCents,
      remaining_amount_cents: remaining,
    })
    .eq('id', row.id)
    .eq('business_id', booking.business_id);

  if (updateError) {
    console.error('[syncBookingPaymentTaxAfterDiscount]', updateError);
  }
}
