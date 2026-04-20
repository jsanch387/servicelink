import Stripe from 'stripe';

/**
 * Singleton-style access to the **platform** Stripe client (secret key).
 * Used for Connect, Billing, Checkout, webhooks, etc.
 */
export function getStripePlatform(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secret);
}
