/**
 * Offline collection methods for web Complete (no Tap to Pay).
 * Subset of SessionPaymentMethod from jobCompletedTypes.
 */

export const WEB_COMPLETE_PAYMENT_METHODS = [
  'cash',
  'payment_app',
  'other',
] as const;

export type WebCompletePaymentMethod =
  (typeof WEB_COMPLETE_PAYMENT_METHODS)[number];

export const WEB_COMPLETE_PAYMENT_METHOD_OPTIONS: {
  id: WebCompletePaymentMethod;
  label: string;
}[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'payment_app', label: 'Payment app' },
  { id: 'other', label: 'Other' },
];
