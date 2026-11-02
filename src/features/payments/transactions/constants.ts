export const PAYMENTS_TRANSACTIONS_DEFAULT_LIMIT = 20;
export const PAYMENTS_TRANSACTIONS_MAX_LIMIT = 50;

export const PAYMENTS_TRANSACTION_KINDS = [
  'payment',
  'refund',
  'payout',
] as const;

export type PaymentsTransactionKind =
  (typeof PAYMENTS_TRANSACTION_KINDS)[number];

export const PAYMENTS_TRANSACTION_SOURCES = [
  'tap_to_pay',
  'payment_link',
  'booking',
  'membership',
  'payout',
  'cash',
  'payment_app',
  'other',
] as const;

/** Offline job collections from `booking_payments` (not Stripe). */
export const OFFLINE_SESSION_PAYMENT_METHODS = [
  'cash',
  'payment_app',
  'other',
] as const;

export type OfflineSessionPaymentMethod =
  (typeof OFFLINE_SESSION_PAYMENT_METHODS)[number];

export const OFFLINE_SESSION_PAYMENT_METHOD_LABELS: Record<
  OfflineSessionPaymentMethod,
  string
> = {
  cash: 'Cash',
  payment_app: 'Payment app',
  other: 'Other',
};

export const LOCAL_BOOKING_PAYMENT_ID_PREFIX = 'local_bp_';

export function localBookingPaymentTransactionId(
  bookingPaymentId: string
): string {
  return `${LOCAL_BOOKING_PAYMENT_ID_PREFIX}${bookingPaymentId}`;
}

export const PAYMENTS_TRANSACTION_TONES = ['in', 'out', 'payout'] as const;

export type PaymentsTransactionTone =
  (typeof PAYMENTS_TRANSACTION_TONES)[number];

export type PaymentsTransactionSource =
  (typeof PAYMENTS_TRANSACTION_SOURCES)[number];

export const PAYMENTS_TRANSACTIONS_SIGN_IN_AGAIN =
  'Sign in again to view transactions.';

export const PAYMENTS_TRANSACTIONS_PRO_REQUIRED =
  'Upgrade to Pro to view transactions.';

export const PAYMENTS_TRANSACTIONS_CONNECT_REQUIRED =
  'Set up Stripe payments to view transactions.';

export const PAYMENTS_TRANSACTIONS_LOAD_ERROR =
  "Couldn't load transactions. Try again.";

export const PAYMENTS_TRANSACTIONS_RATE_LIMIT_ERROR =
  'Too many requests. Please wait a moment and try again.';
