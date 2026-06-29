import type Stripe from 'stripe';

const checkoutAutomaticTaxBase = {
  automatic_tax: { enabled: true },
  billing_address_collection: 'auto',
} satisfies Pick<
  Stripe.Checkout.SessionCreateParams,
  'automatic_tax' | 'billing_address_collection'
>;

/**
 * Stripe Tax for Checkout — requires Tax enabled in Dashboard (head office +
 * registrations). Without `automatic_tax` on the session, Dashboard settings
 * alone do not add tax at checkout.
 *
 * `customer_update` is only valid when the session uses `customer` (existing
 * Stripe Customer). First-time checkouts with `customer_email` must omit it.
 */
export function buildStripeCheckoutAutomaticTaxParams(options: {
  hasExistingCustomer: boolean;
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  'automatic_tax' | 'customer_update' | 'billing_address_collection'
> {
  if (!options.hasExistingCustomer) {
    return checkoutAutomaticTaxBase;
  }

  return {
    ...checkoutAutomaticTaxBase,
    customer_update: { address: 'auto' },
  };
}

export const stripeSubscriptionAutomaticTaxParams = {
  automatic_tax: { enabled: true },
} satisfies Pick<Stripe.SubscriptionCreateParams, 'automatic_tax'>;
