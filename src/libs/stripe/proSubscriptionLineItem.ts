import type Stripe from 'stripe';

/**
 * Checkout line item for Pro subscription with tax **exclusive** (customer pays
 * list price + sales tax). Reads amount/product from STRIPE_PRO_PRICE_ID but
 * overrides tax_behavior so Dashboard "include tax in price" does not apply.
 */
export async function buildProSubscriptionCheckoutLineItem(
  stripe: Stripe,
  priceId: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const price = await stripe.prices.retrieve(priceId);

  const productId =
    typeof price.product === 'string' ? price.product : price.product?.id;
  const unitAmount = price.unit_amount;
  const currency = price.currency;
  const interval = price.recurring?.interval;

  if (!productId || unitAmount == null || !currency || !interval) {
    throw new Error(
      'STRIPE_PRO_PRICE_ID must be a recurring price with unit_amount and product'
    );
  }

  return {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: unitAmount,
      product: productId,
      recurring: { interval },
      tax_behavior: 'exclusive',
    },
  };
}

/** Subscription item for API-created Pro subs (silent trial path). */
export async function buildProSubscriptionCreateItem(
  stripe: Stripe,
  priceId: string
): Promise<Stripe.SubscriptionCreateParams.Item> {
  const price = await stripe.prices.retrieve(priceId);

  const productId =
    typeof price.product === 'string' ? price.product : price.product?.id;
  const unitAmount = price.unit_amount;
  const currency = price.currency;
  const interval = price.recurring?.interval;

  if (!productId || unitAmount == null || !currency || !interval) {
    throw new Error(
      'STRIPE_PRO_PRICE_ID must be a recurring price with unit_amount and product'
    );
  }

  return {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: unitAmount,
      product: productId,
      recurring: { interval },
      tax_behavior: 'exclusive',
    },
  };
}
