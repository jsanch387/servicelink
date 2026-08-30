/** Official Stripe Standard US pricing. https://stripe.com/pricing */
export const STRIPE_PRICING_URL = 'https://stripe.com/pricing';

export const STRIPE_PROCESSING_FEE_TITLE = 'Stripe charges';

export const STRIPE_FEE_RATES = [
  { id: 'online', label: 'Cards', value: '2.9% + 30¢' },
  { id: 'tap_to_pay', label: 'Tap to pay', value: '2.7% + 5¢' },
] as const;

export const STRIPE_PRICING_LABEL = 'Stripe pricing';

export const STRIPE_CONNECT_NOTICE_TITLE = "Stripe isn't connected";

export const STRIPE_CONNECT_NOTICE_BODY =
  'Connect to see card charges, refunds, payouts, and fees.';

export const STRIPE_CONNECT_NOTICE_CTA = 'Connect Stripe';

export const TRANSACTIONS_LEDGER_CAPTION =
  'Card amounts are after Stripe fees.';
