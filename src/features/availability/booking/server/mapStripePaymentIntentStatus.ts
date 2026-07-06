/**
 * Map Stripe PaymentIntent status to booking_tap_to_pay_intents.status.
 */

import type { BookingTapToPayIntentStatus } from './tapToPayTypes';

const ALLOWED_STATUSES = new Set<BookingTapToPayIntentStatus>([
  'created',
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'succeeded',
  'canceled',
  'failed',
]);

export function mapStripePaymentIntentStatus(
  status: string | null | undefined
): BookingTapToPayIntentStatus {
  const normalized = (status ?? '').trim() as BookingTapToPayIntentStatus;
  if (ALLOWED_STATUSES.has(normalized)) {
    return normalized;
  }
  return 'created';
}
