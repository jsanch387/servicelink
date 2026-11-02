import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { isWalkUpPaymentLinkKind } from './applyWalkUpPaymentCheckoutCompleted';
import { WALKUP_PAYMENT_STATUS } from './constants';
import { paymentRequestsOf } from './paymentRequestsQuery';

export type ApplyWalkUpPaymentCheckoutExpiredResult =
  | { handled: true }
  | { handled: false; reason: string };

/**
 * Connect `checkout.session.expired` with `metadata.kind = walkup_payment_link`.
 * Marks an open row expired so `/p/…` does not send the customer to a dead Checkout.
 */
export async function applyWalkUpPaymentCheckoutExpired(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    session: Stripe.Checkout.Session;
  }
): Promise<ApplyWalkUpPaymentCheckoutExpiredResult> {
  const { event, session } = args;
  if (!isWalkUpPaymentLinkKind(session.metadata)) {
    return { handled: false, reason: 'not_walkup_payment_link' };
  }

  const paymentRequestId =
    typeof session.metadata?.paymentRequestId === 'string'
      ? session.metadata.paymentRequestId.trim()
      : '';

  let row: { id: string; status: string } | null = null;

  if (paymentRequestId) {
    const { data, error } = await paymentRequestsOf(supabase)
      .select('id, status')
      .eq('id', paymentRequestId)
      .maybeSingle();
    if (error) {
      console.error('[walk-up:webhook] expire load payment_requests failed', {
        eventId: event.id,
        sessionId: session.id,
        paymentRequestId,
        error,
      });
      return { handled: true };
    }
    row = data;
  }

  if (!row) {
    const { data, error } = await paymentRequestsOf(supabase)
      .select('id, status')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();
    if (error) {
      console.error('[walk-up:webhook] expire lookup by session failed', {
        eventId: event.id,
        sessionId: session.id,
        error,
      });
      return { handled: true };
    }
    row = data;
  }

  if (!row) {
    console.error('[walk-up:webhook] expire missing payment_requests row', {
      eventId: event.id,
      sessionId: session.id,
      paymentRequestId,
    });
    return { handled: true };
  }

  if (row.status !== WALKUP_PAYMENT_STATUS.OPEN) {
    return { handled: true };
  }

  const { error: updateError } = await paymentRequestsOf(supabase)
    .update({
      status: WALKUP_PAYMENT_STATUS.EXPIRED,
      stripe_checkout_session_id: session.id,
    })
    .eq('id', row.id)
    .eq('status', WALKUP_PAYMENT_STATUS.OPEN);

  if (updateError) {
    console.error('[walk-up:webhook] mark expired failed', {
      eventId: event.id,
      rowId: row.id,
      sessionId: session.id,
      error: updateError,
    });
  }

  return { handled: true };
}
