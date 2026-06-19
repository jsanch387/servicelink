/**
 * Map Stripe PaymentIntent status to booking_tap_to_pay_intents.status.
 */

const ALLOWED_STATUSES = new Set([
  'created',
  'requires_payment_method',
  'processing',
  'succeeded',
  'canceled',
  'failed',
]);

export function mapStripePaymentIntentStatus(
  status: string | null | undefined
): string {
  const normalized = (status ?? '').trim();
  if (ALLOWED_STATUSES.has(normalized)) return normalized;
  return 'created';
}
