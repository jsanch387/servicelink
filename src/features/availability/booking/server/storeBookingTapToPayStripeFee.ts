import { getStripeConnectClient } from '@/libs/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

import { reportedStripeFeeCents } from './reportedStripeFeeCents';

/**
 * Writes `session_stripe_fee_cents` only when Stripe's balance transaction
 * already has a fee. Leaves the column null when the fee is not reported yet.
 * Does not replace a fee that was already stored.
 */
export async function storeBookingTapToPayStripeFeeIfReported(opts: {
  admin: SupabaseClient;
  stripeAccountId: string;
  paymentIntentId: string;
}): Promise<void> {
  const paymentIntentId = opts.paymentIntentId.trim();
  const stripeAccountId = opts.stripeAccountId.trim();
  if (!paymentIntentId || !stripeAccountId) return;

  const stripe = getStripeConnectClient(stripeAccountId);
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  });
  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge === 'string') return;

  const feeCents = reportedStripeFeeCents(charge.balance_transaction);
  if (feeCents === null) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (opts.admin as any)
    .from('booking_payments')
    .update({
      session_stripe_fee_cents: feeCents,
      updated_at: new Date().toISOString(),
    })
    .eq('session_payment_stripe_payment_intent_id', paymentIntentId)
    .is('session_stripe_fee_cents', null);

  if (error) throw error;
}

/**
 * Webhook path. No Stripe call unless this PaymentIntent is already the
 * booking's Tap to Pay charge and the fee column is still empty.
 */
export async function recordBookingTapToPayStripeFeeFromWebhook(opts: {
  admin: SupabaseClient;
  stripeAccountId: string;
  paymentIntentId: string;
}): Promise<void> {
  const paymentIntentId = opts.paymentIntentId.trim();
  if (!paymentIntentId) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (opts.admin as any)
    .from('booking_payments')
    .select('session_stripe_fee_cents')
    .eq('session_payment_stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (error) throw error;
  const row = data as { session_stripe_fee_cents?: number | null } | null;
  if (!row || row.session_stripe_fee_cents != null) return;

  await storeBookingTapToPayStripeFeeIfReported({
    admin: opts.admin,
    stripeAccountId: opts.stripeAccountId,
    paymentIntentId,
  });
}
