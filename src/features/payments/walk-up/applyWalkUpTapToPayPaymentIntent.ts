import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import {
  WALKUP_PAYMENT_COLLECTION_TAP_TO_PAY,
  WALKUP_PAYMENT_STATUS,
  WALKUP_PAYMENT_TAP_TO_PAY_KIND,
} from './constants';
import { paymentRequestsOf } from './paymentRequestsQuery';

export function isWalkUpTapToPayKind(
  metadata: Stripe.Metadata | null | undefined
): boolean {
  return metadata?.kind === WALKUP_PAYMENT_TAP_TO_PAY_KIND;
}

export type ApplyWalkUpTapToPayPaymentIntentResult =
  | { handled: true }
  | { handled: false; reason: string; retry?: boolean };

type PaymentRequestLookupRow = {
  id: string;
  business_id: string;
  collection_method: string;
  status: string;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
};

/**
 * Connect `payment_intent.*` with `metadata.kind = walkup_tap_to_pay`.
 * Marks the `payment_requests` row. Does not create a booking or send a receipt.
 */
export async function applyWalkUpTapToPayPaymentIntent(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    paymentIntent: Stripe.PaymentIntent;
  }
): Promise<ApplyWalkUpTapToPayPaymentIntentResult> {
  const { event, paymentIntent } = args;
  if (!isWalkUpTapToPayKind(paymentIntent.metadata)) {
    return { handled: false, reason: 'not_walkup_tap_to_pay' };
  }

  const loaded = await loadWalkUpTapToPayPaymentRequest(supabase, {
    eventId: event.id,
    paymentIntent,
  });
  if (!loaded.ok) {
    return {
      handled: false,
      reason: loaded.reason,
      retry: loaded.retry,
    };
  }

  const { row } = loaded;
  if (row.status === WALKUP_PAYMENT_STATUS.PAID) {
    return { handled: true };
  }

  const storedPiId = row.stripe_payment_intent_id?.trim() ?? '';
  if (storedPiId && storedPiId !== paymentIntent.id) {
    console.warn('[walk-up:tap-to-pay:webhook] payment intent id mismatch', {
      eventId: event.id,
      rowId: row.id,
      storedPiId,
      paymentIntentId: paymentIntent.id,
    });
    return { handled: true };
  }

  const accountCheck = await assertWalkUpTapToPayEventAccount(supabase, {
    event,
    row,
  });
  if (!accountCheck.ok) {
    return {
      handled: false,
      reason: accountCheck.reason,
      retry: accountCheck.retry,
    };
  }

  if (event.type === 'payment_intent.succeeded') {
    return applySucceeded(supabase, { event, paymentIntent, row });
  }

  if (event.type === 'payment_intent.canceled') {
    return applyTerminalStatus(supabase, {
      event,
      paymentIntent,
      row,
      status: WALKUP_PAYMENT_STATUS.CANCELED,
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    return applyTerminalStatus(supabase, {
      event,
      paymentIntent,
      row,
      status: WALKUP_PAYMENT_STATUS.FAILED,
    });
  }

  return { handled: false, reason: 'unsupported_event' };
}

async function loadWalkUpTapToPayPaymentRequest(
  supabase: SupabaseClient<Database>,
  args: {
    eventId: string;
    paymentIntent: Stripe.PaymentIntent;
  }
): Promise<
  | { ok: true; row: PaymentRequestLookupRow }
  | { ok: false; reason: string; retry: boolean }
> {
  const paymentRequestId =
    typeof args.paymentIntent.metadata?.paymentRequestId === 'string'
      ? args.paymentIntent.metadata.paymentRequestId.trim()
      : '';
  const metadataBusinessId =
    typeof args.paymentIntent.metadata?.businessId === 'string'
      ? args.paymentIntent.metadata.businessId.trim()
      : '';

  const select =
    'id, business_id, collection_method, status, amount_cents, stripe_payment_intent_id' as const;

  let row: PaymentRequestLookupRow | null = null;

  if (paymentRequestId) {
    const { data, error } = await paymentRequestsOf(supabase)
      .select(select)
      .eq('id', paymentRequestId)
      .maybeSingle();
    if (error) {
      console.error(
        '[walk-up:tap-to-pay:webhook] load payment_requests failed',
        {
          eventId: args.eventId,
          paymentIntentId: args.paymentIntent.id,
          paymentRequestId,
          error,
        }
      );
      return { ok: false, reason: 'lookup_failed', retry: true };
    }
    row = (data as PaymentRequestLookupRow | null) ?? null;
  }

  if (!row) {
    const { data, error } = await paymentRequestsOf(supabase)
      .select(select)
      .eq('stripe_payment_intent_id', args.paymentIntent.id)
      .maybeSingle();
    if (error) {
      console.error(
        '[walk-up:tap-to-pay:webhook] lookup by payment intent failed',
        {
          eventId: args.eventId,
          paymentIntentId: args.paymentIntent.id,
          error,
        }
      );
      return { ok: false, reason: 'lookup_failed', retry: true };
    }
    row = (data as PaymentRequestLookupRow | null) ?? null;
  }

  if (!row) {
    console.error('[walk-up:tap-to-pay:webhook] missing payment_requests row', {
      eventId: args.eventId,
      paymentIntentId: args.paymentIntent.id,
      paymentRequestId,
    });
    return { ok: false, reason: 'missing_row', retry: false };
  }

  if (row.collection_method !== WALKUP_PAYMENT_COLLECTION_TAP_TO_PAY) {
    console.warn('[walk-up:tap-to-pay:webhook] collection_method mismatch', {
      eventId: args.eventId,
      rowId: row.id,
      collectionMethod: row.collection_method,
    });
    return { ok: false, reason: 'not_tap_to_pay_row', retry: false };
  }

  if (metadataBusinessId && metadataBusinessId !== row.business_id) {
    console.warn('[walk-up:tap-to-pay:webhook] business id mismatch', {
      eventId: args.eventId,
      rowId: row.id,
      metadataBusinessId,
    });
    return { ok: false, reason: 'business_mismatch', retry: false };
  }

  return { ok: true, row };
}

async function assertWalkUpTapToPayEventAccount(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    row: PaymentRequestLookupRow;
  }
): Promise<{ ok: true } | { ok: false; reason: string; retry: boolean }> {
  const connectedAccountId =
    typeof args.event.account === 'string' ? args.event.account.trim() : '';
  if (!connectedAccountId) {
    return { ok: true };
  }

  const { data, error } = await paymentAccountsOf(supabase)
    .select('stripe_account_id')
    .eq('business_id', args.row.business_id)
    .maybeSingle();

  if (error) {
    console.error('[walk-up:tap-to-pay:webhook] load payment_accounts failed', {
      eventId: args.event.id,
      businessId: args.row.business_id,
      error,
    });
    return { ok: false, reason: 'account_lookup_failed', retry: true };
  }

  const merchantAccountId =
    typeof data?.stripe_account_id === 'string'
      ? data.stripe_account_id.trim()
      : '';
  if (!merchantAccountId || merchantAccountId !== connectedAccountId) {
    console.error('[walk-up:tap-to-pay:webhook] stripe account mismatch', {
      eventId: args.event.id,
      rowId: args.row.id,
      businessId: args.row.business_id,
    });
    return { ok: false, reason: 'stripe_account_mismatch', retry: false };
  }

  return { ok: true };
}

async function applySucceeded(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    paymentIntent: Stripe.PaymentIntent;
    row: PaymentRequestLookupRow;
  }
): Promise<ApplyWalkUpTapToPayPaymentIntentResult> {
  const amountPaidCents =
    typeof args.paymentIntent.amount_received === 'number' &&
    args.paymentIntent.amount_received > 0
      ? args.paymentIntent.amount_received
      : args.paymentIntent.amount;

  if (amountPaidCents !== args.row.amount_cents) {
    console.error('[walk-up:tap-to-pay:webhook] amount mismatch', {
      eventId: args.event.id,
      rowId: args.row.id,
      paymentIntentId: args.paymentIntent.id,
      expectedAmountCents: args.row.amount_cents,
      amountPaidCents,
    });
    const { error } = await paymentRequestsOf(supabase)
      .update({
        status: WALKUP_PAYMENT_STATUS.FAILED,
        paid_amount_cents: amountPaidCents,
        stripe_payment_intent_id: args.paymentIntent.id,
      })
      .eq('id', args.row.id);
    if (error) {
      console.error('[walk-up:tap-to-pay:webhook] mark failed after mismatch', {
        eventId: args.event.id,
        rowId: args.row.id,
        error,
      });
      return { handled: false, reason: 'persist_failed', retry: true };
    }
    return { handled: true };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await paymentRequestsOf(supabase)
    .update({
      status: WALKUP_PAYMENT_STATUS.PAID,
      paid_amount_cents: amountPaidCents,
      paid_at: now,
      stripe_payment_intent_id: args.paymentIntent.id,
    })
    .eq('id', args.row.id)
    .neq('status', WALKUP_PAYMENT_STATUS.PAID);

  if (updateError) {
    console.error('[walk-up:tap-to-pay:webhook] mark paid failed', {
      eventId: args.event.id,
      rowId: args.row.id,
      paymentIntentId: args.paymentIntent.id,
      error: updateError,
    });
    return { handled: false, reason: 'persist_failed', retry: true };
  }

  return { handled: true };
}

async function applyTerminalStatus(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    paymentIntent: Stripe.PaymentIntent;
    row: PaymentRequestLookupRow;
    status:
      | typeof WALKUP_PAYMENT_STATUS.CANCELED
      | typeof WALKUP_PAYMENT_STATUS.FAILED;
  }
): Promise<ApplyWalkUpTapToPayPaymentIntentResult> {
  const { error: updateError } = await paymentRequestsOf(supabase)
    .update({
      status: args.status,
      stripe_payment_intent_id: args.paymentIntent.id,
    })
    .eq('id', args.row.id)
    .eq('status', WALKUP_PAYMENT_STATUS.OPEN);

  if (updateError) {
    console.error('[walk-up:tap-to-pay:webhook] mark status failed', {
      eventId: args.event.id,
      rowId: args.row.id,
      paymentIntentId: args.paymentIntent.id,
      status: args.status,
      error: updateError,
    });
    return { handled: false, reason: 'persist_failed', retry: true };
  }

  return { handled: true };
}
