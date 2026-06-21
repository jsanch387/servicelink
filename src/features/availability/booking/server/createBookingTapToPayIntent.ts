/**
 * Create a Stripe PaymentIntent for Tap to Pay on the Complete sheet.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getStripePlatform } from '@/libs/stripe';
import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import { mapStripePaymentIntentStatus } from './mapStripePaymentIntentStatus';
import type { TapToPayBookingContext } from './resolveTapToPayBookingContext';
import { OPEN_TAP_TO_PAY_PI_STATUSES } from './tapToPayTypes';

export type CreateBookingTapToPayIntentResult =
  | {
      ok: true;
      paymentIntentId: string;
      clientSecret: string;
      amountCents: number;
      currency: string;
    }
  | { ok: false; error: string; httpStatus: number };

async function cancelOpenIntentsForBooking(opts: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  bookingId: string;
  stripeAccountId: string;
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (opts.admin as any)
    .from('booking_tap_to_pay_intents')
    .select('stripe_payment_intent_id, status')
    .eq('booking_id', opts.bookingId)
    .is('canceled_at', null)
    .is('job_completed_at', null);

  const stripe = getStripePlatform();
  const now = new Date().toISOString();

  for (const row of rows ?? []) {
    const piId = String(
      (row as { stripe_payment_intent_id?: string }).stripe_payment_intent_id ??
        ''
    ).trim();
    if (!piId) continue;

    const status = String((row as { status?: string }).status ?? '').trim();
    if (status === 'succeeded') continue;

    try {
      const pi = await stripe.paymentIntents.retrieve(piId, {
        stripeAccount: opts.stripeAccountId,
      });
      const piStatus = String(pi.status);
      if (pi.status === 'succeeded') {
        continue;
      }

      let markCanceled = false;
      if (OPEN_TAP_TO_PAY_PI_STATUSES.has(piStatus)) {
        await stripe.paymentIntents.cancel(piId, {
          stripeAccount: opts.stripeAccountId,
        });
        markCanceled = true;
      } else if (piStatus === 'canceled' || piStatus === 'failed') {
        markCanceled = true;
      }

      if (!markCanceled) {
        continue;
      }
    } catch (e) {
      console.warn('[tap-to-pay] cancel stale intent failed', piId, e);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (opts.admin as any)
      .from('booking_tap_to_pay_intents')
      .update({ status: 'canceled', canceled_at: now })
      .eq('stripe_payment_intent_id', piId);
  }
}

export async function createBookingTapToPayIntent(opts: {
  ctx: TapToPayBookingContext;
  sessionFees: JobCompletedSessionFeeInput[];
  amountCents: number;
}): Promise<CreateBookingTapToPayIntentResult> {
  const amountCents = opts.amountCents;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'Nothing to collect for this booking.',
    };
  }

  const admin = createSupabaseAdminClient();
  await cancelOpenIntentsForBooking({
    admin,
    bookingId: opts.ctx.bookingId,
    stripeAccountId: opts.ctx.stripeAccountId,
  });

  const stripe = getStripePlatform();
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: opts.ctx.currency,
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        metadata: {
          kind: 'booking_tap_to_pay',
          bookingId: opts.ctx.bookingId,
          businessId: opts.ctx.businessId,
        },
      },
      { stripeAccount: opts.ctx.stripeAccountId }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe create failed';
    console.error('[tap-to-pay] paymentIntents.create failed', message);
    return {
      ok: false,
      httpStatus: 500,
      error: "Couldn't start Tap to Pay. Try again or mark as paid.",
    };
  }

  const paymentIntentId = paymentIntent.id?.trim();
  const clientSecret = paymentIntent.client_secret?.trim();
  if (!paymentIntentId || !clientSecret) {
    return {
      ok: false,
      httpStatus: 500,
      error: "Couldn't start Tap to Pay. Try again or mark as paid.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin as any)
    .from('booking_tap_to_pay_intents')
    .insert({
      booking_id: opts.ctx.bookingId,
      business_id: opts.ctx.businessId,
      stripe_payment_intent_id: paymentIntentId,
      amount_cents: amountCents,
      currency: opts.ctx.currency,
      status: mapStripePaymentIntentStatus(paymentIntent.status),
      session_fees_snapshot: opts.sessionFees,
    });

  if (insertError) {
    console.error('[tap-to-pay] intent row insert failed', insertError);
    try {
      await stripe.paymentIntents.cancel(paymentIntentId, {
        stripeAccount: opts.ctx.stripeAccountId,
      });
    } catch {
      // best effort
    }
    return {
      ok: false,
      httpStatus: 500,
      error: "Couldn't start Tap to Pay. Try again or mark as paid.",
    };
  }

  return {
    ok: true,
    paymentIntentId,
    clientSecret,
    amountCents,
    currency: opts.ctx.currency,
  };
}
