import {
  customerAlreadyReviewedForBooking,
  loadReviewInviteEligibilityContext,
  willSendReviewInviteOnBookingComplete,
} from '@/features/reviews/server/reviewInviteEligibility';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { attachPaymentSummaryToDisplay } from '../dashboard/utils/attachPaymentSummaryToDisplay';
import {
  mapBookingRowToDisplay,
  type BookingRow,
} from '../dashboard/utils/mapBookingRowToDisplay';

export async function hydrateBookingRowsForDisplay(
  supabase: SupabaseClient<Database>,
  businessId: string,
  rows: BookingRow[]
): Promise<ReturnType<typeof mapBookingRowToDisplay>[]> {
  const bookingIds = rows.map(row => row.id);
  const reviewInviteEligibilityContext =
    rows.length > 0
      ? await loadReviewInviteEligibilityContext(supabase, businessId, rows)
      : null;
  const paymentByBookingId = new Map<
    string,
    {
      payment_status: string | null;
      payment_method_selected: string | null;
      currency: string | null;
      total_amount_cents: number | null;
      paid_online_amount_cents: number | null;
      remaining_amount_cents: number | null;
    }
  >();

  if (bookingIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paymentRows } = await (supabase as any)
      .from('booking_payments')
      .select(
        'booking_id, payment_status, payment_method_selected, currency, total_amount_cents, paid_online_amount_cents, remaining_amount_cents'
      )
      .in('booking_id', bookingIds);

    const normalized = (paymentRows ?? []) as Array<{
      booking_id: string;
      payment_status: string | null;
      payment_method_selected: string | null;
      currency: string | null;
      total_amount_cents: number | null;
      paid_online_amount_cents: number | null;
      remaining_amount_cents: number | null;
    }>;

    for (const payment of normalized) {
      if (!payment.booking_id) continue;
      paymentByBookingId.set(payment.booking_id, payment);
    }
  }

  return rows.map(row => {
    const display = mapBookingRowToDisplay(row);
    const payment = paymentByBookingId.get(row.id);
    const willSendReviewInviteOnComplete = reviewInviteEligibilityContext
      ? willSendReviewInviteOnBookingComplete(
          row,
          reviewInviteEligibilityContext
        )
      : false;
    const customerAlreadyReviewed = reviewInviteEligibilityContext
      ? customerAlreadyReviewedForBooking(row, reviewInviteEligibilityContext)
      : false;
    return attachPaymentSummaryToDisplay(
      {
        ...display,
        customerAlreadyReviewed,
        willSendReviewInviteOnComplete,
      },
      row,
      payment
    );
  });
}
