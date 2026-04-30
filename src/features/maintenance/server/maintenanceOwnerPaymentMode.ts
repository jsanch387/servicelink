import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';

export type MaintenanceOwnerPaymentMode =
  | 'card_only'
  | 'in_person_only'
  | 'customer_choice';

/**
 * Snapshot for `maintenance_enrollments.owner_payment_mode` from live
 * `payment_settings.checkout_mode` + Stripe readiness (same product rules as public booking).
 */
export function maintenanceOwnerPaymentModeFromCheckout(
  checkoutMode: CheckoutPaymentMode | null,
  paymentsEnabled: boolean,
  chargesEnabled: boolean
): MaintenanceOwnerPaymentMode {
  const mode = checkoutMode ?? null;
  if (mode === 'in_person') {
    return 'in_person_only';
  }
  if (mode === 'customer_choice') {
    return 'customer_choice';
  }
  if (mode === 'in_app') {
    return paymentsEnabled && chargesEnabled ? 'card_only' : 'in_person_only';
  }
  return 'in_person_only';
}
