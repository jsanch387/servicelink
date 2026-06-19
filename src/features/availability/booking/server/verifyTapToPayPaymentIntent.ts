/**
 * Verify a succeeded Tap to Pay PaymentIntent before job_completed persist.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getStripePlatform } from '@/libs/stripe';
import { mapStripePaymentIntentStatus } from './mapStripePaymentIntentStatus';

export type VerifyTapToPayPaymentIntentResult =
  | { ok: true; paymentIntentId: string; amountCents: number }
  | { ok: false; error: string; httpStatus: number };

export async function verifyTapToPayPaymentIntent(opts: {
  bookingId: string;
  businessId: string;
  stripeAccountId: string;
  paymentIntentId: string;
  expectedAmountCents: number;
}): Promise<VerifyTapToPayPaymentIntentResult> {
  const paymentIntentId = opts.paymentIntentId.trim();
  if (!paymentIntentId) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment could not be verified.',
    };
  }

  const admin = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usedElsewhere } = await (admin as any)
    .from('booking_payments')
    .select('booking_id')
    .eq('session_payment_stripe_payment_intent_id', paymentIntentId)
    .neq('booking_id', opts.bookingId)
    .maybeSingle();

  if (usedElsewhere) {
    return {
      ok: false,
      httpStatus: 409,
      error: 'This payment was already used.',
    };
  }

  const stripe = getStripePlatform();
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      stripeAccount: opts.stripeAccountId,
    });
  } catch (e) {
    console.error('[tap-to-pay] paymentIntents.retrieve failed', e);
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment could not be verified.',
    };
  }

  if (paymentIntent.status !== 'succeeded') {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment has not completed yet.',
    };
  }

  if (paymentIntent.amount !== opts.expectedAmountCents) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment amount does not match.',
    };
  }

  const metadata = paymentIntent.metadata ?? {};
  if (metadata.kind !== 'booking_tap_to_pay') {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Invalid payment type.',
    };
  }

  if (metadata.bookingId !== opts.bookingId) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment is not for this booking.',
    };
  }

  if (metadata.businessId !== opts.businessId) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Payment is not for this business.',
    };
  }

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('booking_tap_to_pay_intents')
    .update({
      status: mapStripePaymentIntentStatus(paymentIntent.status),
      updated_at: now,
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  return {
    ok: true,
    paymentIntentId,
    amountCents: paymentIntent.amount,
  };
}

export async function markTapToPayIntentJobCompleted(opts: {
  paymentIntentId: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('booking_tap_to_pay_intents')
    .update({
      status: 'succeeded',
      job_completed_at: now,
      updated_at: now,
    })
    .eq('stripe_payment_intent_id', opts.paymentIntentId.trim());
}
