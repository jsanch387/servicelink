/** Stripe Checkout `metadata.kind` for walk-up payment links. */
export const WALKUP_PAYMENT_LINK_KIND = 'walkup_payment_link';

/** Stripe PaymentIntent `metadata.kind` for walk-up Tap to Pay. */
export const WALKUP_PAYMENT_TAP_TO_PAY_KIND = 'walkup_tap_to_pay';

export const WALKUP_PAYMENT_CURRENCY = 'usd';

/** Stripe card minimum for USD. */
export const WALKUP_PAYMENT_MIN_AMOUNT_CENTS = 50;

/** Mobile keypad cap: $9,999.99 */
export const WALKUP_PAYMENT_MAX_AMOUNT_CENTS = 999_999;

export const WALKUP_PAYMENT_NOTE_MAX_LENGTH = 200;

export const WALKUP_PAYMENT_COLLECTION_CHECKOUT_LINK = 'checkout_link';

export const WALKUP_PAYMENT_COLLECTION_TAP_TO_PAY = 'tap_to_pay';

export const WALKUP_TAP_TO_PAY_START_ERROR =
  "Couldn't start Tap to Pay. Try again.";

export const WALKUP_TAP_TO_PAY_SIGN_IN_AGAIN =
  'Sign in again to collect payment.';

export const WALKUP_PAYMENT_STATUS = {
  OPEN: 'open',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
  FAILED: 'failed',
} as const;

export type WalkUpPaymentStatus =
  (typeof WALKUP_PAYMENT_STATUS)[keyof typeof WALKUP_PAYMENT_STATUS];

/** iMessage / social unfurl — generic on purpose, not amount or ServiceLink. */
export const PAYMENT_LINK_SHARE_TITLE = 'Payment Link';
export const PAYMENT_LINK_SHARE_DESCRIPTION = 'Secure checkout';
