/**
 * Shared Tap to Pay types — keep in sync with
 * docs/sql/booking_tap_to_pay_phase2_migration.sql
 */

/** Values stored in booking_tap_to_pay_intents.status */
export type BookingTapToPayIntentStatus =
  | 'created'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'failed';

export interface BookingTapToPayIntentRow {
  id: string;
  booking_id: string;
  business_id: string;
  stripe_payment_intent_id: string;
  amount_cents: number;
  currency: string;
  status: BookingTapToPayIntentStatus | string;
  session_fees_snapshot: unknown;
  job_completed_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Stripe PI statuses that can still be tapped / confirmed on device. */
export const OPEN_TAP_TO_PAY_PI_STATUSES = new Set([
  'created',
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
]);
