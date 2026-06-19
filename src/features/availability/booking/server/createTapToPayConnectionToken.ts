/**
 * Stripe Terminal connection token for Tap to Pay SDK init.
 */

import { getStripePlatform } from '@/libs/stripe';

export type CreateTapToPayConnectionTokenResult =
  | { ok: true; secret: string }
  | { ok: false; error: string };

export async function createTapToPayConnectionToken(opts: {
  stripeAccountId: string;
}): Promise<CreateTapToPayConnectionTokenResult> {
  const stripeAccountId = opts.stripeAccountId.trim();
  if (!stripeAccountId) {
    return { ok: false, error: 'Stripe account is not configured.' };
  }

  try {
    const stripe = getStripePlatform();
    const token = await stripe.terminal.connectionTokens.create(
      {},
      { stripeAccount: stripeAccountId }
    );
    const secret = token.secret?.trim();
    if (!secret) {
      return { ok: false, error: 'Stripe did not return a connection token.' };
    }
    return { ok: true, secret };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Could not connect to payments.';
    console.error('[tap-to-pay] connection token failed', message);
    return {
      ok: false,
      error: "Couldn't connect to payments. Try again or mark as paid.",
    };
  }
}
