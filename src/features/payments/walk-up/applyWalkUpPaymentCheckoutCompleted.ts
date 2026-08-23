import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import {
  WALKUP_PAYMENT_LINK_KIND,
  WALKUP_PAYMENT_STATUS,
} from './constants';
import { paymentRequestsOf } from './paymentRequestsQuery';

export function isWalkUpPaymentLinkKind(
  metadata: Stripe.Metadata | null | undefined
): boolean {
  return metadata?.kind === WALKUP_PAYMENT_LINK_KIND;
}

export type ApplyWalkUpPaymentCheckoutCompletedResult =
  | { handled: true }
  | { handled: false; reason: string };

function stripePaymentIntentId(
  session: Stripe.Checkout.Session
): string | null {
  if (typeof session.payment_intent === 'string') {
    const id = session.payment_intent.trim();
    return id || null;
  }
  if (session.payment_intent && typeof session.payment_intent === 'object') {
    const id = session.payment_intent.id?.trim();
    return id || null;
  }
  return null;
}

/**
 * Connect `checkout.session.completed` with `metadata.kind = walkup_payment_link`.
 * Marks the `payment_requests` row paid. Does not create a booking.
 */
export async function applyWalkUpPaymentCheckoutCompleted(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    session: Stripe.Checkout.Session;
  }
): Promise<ApplyWalkUpPaymentCheckoutCompletedResult> {
  const { event, session } = args;
  if (!isWalkUpPaymentLinkKind(session.metadata)) {
    return { handled: false, reason: 'not_walkup_payment_link' };
  }

  const paymentRequestId =
    typeof session.metadata?.paymentRequestId === 'string'
      ? session.metadata.paymentRequestId.trim()
      : '';

  const query = paymentRequestsOf(supabase).select(
    'id, status, amount_cents, stripe_checkout_session_id'
  );

  let row: {
    id: string;
    status: string;
    amount_cents: number;
    stripe_checkout_session_id: string | null;
  } | null = null;

  if (paymentRequestId) {
    const { data, error } = await query.eq('id', paymentRequestId).maybeSingle();
    if (error) {
      console.error('[walk-up:webhook] load payment_requests failed', {
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
      .select('id, status, amount_cents, stripe_checkout_session_id')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();
    if (error) {
      console.error('[walk-up:webhook] lookup by checkout session failed', {
        eventId: event.id,
        sessionId: session.id,
        error,
      });
      return { handled: true };
    }
    row = data;
  }

  if (!row) {
    console.error('[walk-up:webhook] missing payment_requests row', {
      eventId: event.id,
      sessionId: session.id,
      paymentRequestId,
    });
    return { handled: true };
  }

  if (row.status === WALKUP_PAYMENT_STATUS.PAID) {
    return { handled: true };
  }

  const storedSessionId = row.stripe_checkout_session_id?.trim() ?? '';
  if (storedSessionId && storedSessionId !== session.id) {
    console.warn('[walk-up:webhook] checkout session id mismatch', {
      eventId: event.id,
      rowId: row.id,
      storedSessionId,
      sessionId: session.id,
    });
    return { handled: true };
  }

  const amountPaidCents =
    typeof session.amount_total === 'number' ? session.amount_total : 0;
  if (amountPaidCents !== row.amount_cents) {
    console.error('[walk-up:webhook] amount mismatch', {
      eventId: event.id,
      rowId: row.id,
      sessionId: session.id,
      expectedAmountCents: row.amount_cents,
      amountPaidCents,
    });
    await paymentRequestsOf(supabase)
      .update({
        status: WALKUP_PAYMENT_STATUS.FAILED,
        paid_amount_cents: amountPaidCents,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: stripePaymentIntentId(session),
      })
      .eq('id', row.id);
    return { handled: true };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await paymentRequestsOf(supabase)
    .update({
      status: WALKUP_PAYMENT_STATUS.PAID,
      paid_amount_cents: amountPaidCents,
      paid_at: now,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: stripePaymentIntentId(session),
    })
    .eq('id', row.id)
    .eq('status', WALKUP_PAYMENT_STATUS.OPEN);

  if (updateError) {
    console.error('[walk-up:webhook] mark paid failed', {
      eventId: event.id,
      rowId: row.id,
      sessionId: session.id,
      error: updateError,
    });
  }

  return { handled: true };
}
