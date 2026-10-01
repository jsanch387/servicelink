import { listBookingIdsWithPaidCustomerInvoice } from '@/features/invoices/server/syncInvoiceWithBookingPayment';
import {
  customerAlreadyReviewedForBooking,
  loadReviewInviteEligibilityContext,
  willSendReviewInviteOnBookingComplete,
} from '@/features/reviews/server/reviewInviteEligibility';
import type { Database } from '@/libs/supabase/client';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
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

  const paidInvoiceBookingIds =
    bookingIds.length > 0
      ? await listBookingIdsWithPaidCustomerInvoice(
          createSupabaseAdminClient(),
          businessId,
          bookingIds
        )
      : new Set<string>();

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
    const withPayment = attachPaymentSummaryToDisplay(
      {
        ...display,
        customerAlreadyReviewed,
        willSendReviewInviteOnComplete,
      },
      row,
      payment
    );
    if (!paidInvoiceBookingIds.has(row.id)) return withPayment;
    return {
      ...withPayment,
      payment: {
        paymentStatus: withPayment.payment?.paymentStatus ?? 'paid_full',
        paymentMethodSelected:
          withPayment.payment?.paymentMethodSelected ?? 'none',
        currency: withPayment.payment?.currency ?? 'usd',
        totalAmountCents: withPayment.payment?.totalAmountCents ?? 0,
        paidOnlineAmountCents: withPayment.payment?.paidOnlineAmountCents ?? 0,
        remainingAmountCents: 0,
      },
    };
  });
}
