/**
 * Shared booking + Connect preconditions for Tap to Pay endpoints.
 */

import {
  rejectJobCompletionLifecycle,
  requiredWorkHandoffStatus,
} from './assertJobCompletionLifecycle';
import { computeBookingAmountDue } from './computeBookingAmountDue';
import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkHandoffStatus } from '../workHandoffStatus';

export interface TapToPayReject {
  httpStatus: number;
  error: string;
}

export interface TapToPayBookingContext {
  bookingId: string;
  businessId: string;
  workHandoffStatus: WorkHandoffStatus;
  servicePriceCents: number | null;
  addonDetails: unknown;
  paidOnlineAmountCents: number;
  currency: string;
  stripeAccountId: string;
}

export type ResolveTapToPayBookingContextResult =
  | { ok: true; ctx: TapToPayBookingContext }
  | { ok: false; reject: TapToPayReject };

interface BookingRow {
  id: string;
  business_id: string;
  status: string | null;
  job_status: string | null;
  work_handoff_status: string | null;
  service_price_cents: number | null;
  addon_details: unknown;
}

function lifecycleReject(
  httpStatus: number,
  error: string
): ResolveTapToPayBookingContextResult {
  return { ok: false, reject: { httpStatus, error } };
}

export async function resolveTapToPayBookingContext(opts: {
  supabase: SupabaseClient<Database>;
  bookingId: string;
  businessId: string;
}): Promise<ResolveTapToPayBookingContextResult> {
  const { data: bookingData, error: bookingError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opts.supabase as any)
      .from('bookings')
      .select(
        'id, business_id, status, job_status, work_handoff_status, service_price_cents, addon_details'
      )
      .eq('id', opts.bookingId)
      .maybeSingle();

  if (bookingError) {
    return lifecycleReject(500, 'Could not load booking');
  }

  const booking = bookingData as BookingRow | null;
  if (!booking || booking.business_id !== opts.businessId) {
    return lifecycleReject(404, 'Booking not found');
  }

  const lifecycleRejectReason = rejectJobCompletionLifecycle(booking, {
    forPaymentCollection: true,
  });
  if (lifecycleRejectReason) {
    return lifecycleReject(
      lifecycleRejectReason.httpStatus,
      lifecycleRejectReason.error
    );
  }

  const handoff = requiredWorkHandoffStatus(booking.work_handoff_status);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paymentsData } = await (opts.supabase as any)
    .from('booking_payments')
    .select('paid_online_amount_cents, currency')
    .eq('booking_id', opts.bookingId)
    .maybeSingle();

  const payments = paymentsData as {
    paid_online_amount_cents?: number | null;
    currency?: string | null;
  } | null;

  const { data: accountRow, error: accountError } = await paymentAccountsOf(
    opts.supabase
  )
    .select('stripe_account_id, charges_enabled')
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (accountError) {
    return lifecycleReject(500, 'Could not load payment account.');
  }

  const stripeAccountId = (
    accountRow as { stripe_account_id?: string } | null
  )?.stripe_account_id?.trim();
  const chargesEnabled =
    (accountRow as { charges_enabled?: boolean } | null)?.charges_enabled ===
    true;

  if (!stripeAccountId || !chargesEnabled) {
    return lifecycleReject(422, 'Set up Stripe payments to use Tap to Pay.');
  }

  return {
    ok: true,
    ctx: {
      bookingId: booking.id,
      businessId: opts.businessId,
      workHandoffStatus: handoff,
      servicePriceCents: booking.service_price_cents,
      addonDetails: booking.addon_details,
      paidOnlineAmountCents: payments?.paid_online_amount_cents ?? 0,
      currency: payments?.currency?.trim()?.toLowerCase() || 'usd',
      stripeAccountId,
    },
  };
}

export function computeTapToPayAmountDue(
  ctx: TapToPayBookingContext,
  sessionFees: JobCompletedSessionFeeInput[]
) {
  return computeBookingAmountDue({
    servicePriceCents: ctx.servicePriceCents,
    addonDetails: ctx.addonDetails,
    sessionFees,
    paidOnlineAmountCents: ctx.paidOnlineAmountCents,
    sessionPayment: undefined,
  });
}
