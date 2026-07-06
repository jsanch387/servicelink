import Stripe from 'stripe';

function requireStripeSecret(): string {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return secret;
}

/**
 * Stripe client scoped to a Connect account (`Stripe-Account` on every request).
 * Use for Tap to Pay direct charges — PI, connection tokens, and locations must
 * all live on the same connected account.
 */
export function getStripeConnectClient(stripeAccountId: string): Stripe {
  const accountId = stripeAccountId.trim();
  if (!accountId) {
    throw new Error('Stripe Connect account id is required');
  }

  return new Stripe(requireStripeSecret(), {
    stripeAccount: accountId,
  });
}
