import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';

export interface MaintenanceLivePaymentFlags {
  checkoutMode: CheckoutPaymentMode | null;
  paymentsEnabled: boolean;
  chargesEnabled: boolean;
  ownerHasProForPayments: boolean;
}

/**
 * What the customer may see on the public maintenance page (mirrors booking checkout rules).
 * If card checkout is not available, pay-in-person is still offered whenever it fits the
 * owner mode, or as a fallback when the mode is unknown or in-app without a working Stripe
 * connection.
 */
export function maintenanceCustomerPaymentOptions(
  flags: MaintenanceLivePaymentFlags
): {
  showPayInPerson: boolean;
  showPayWithCard: boolean;
} {
  const mode = flags.checkoutMode;
  const stripeReady =
    flags.ownerHasProForPayments &&
    flags.paymentsEnabled &&
    flags.chargesEnabled;

  const showPayWithCard =
    stripeReady && (mode === 'in_app' || mode === 'customer_choice');

  const modeAllowsInPerson = mode === 'in_person' || mode === 'customer_choice';
  const inAppWithoutWorkingCard = mode === 'in_app' && !showPayWithCard;
  const unknownCheckoutMode = mode === null;

  const showPayInPerson =
    modeAllowsInPerson || inAppWithoutWorkingCard || unknownCheckoutMode;

  return { showPayInPerson, showPayWithCard };
}
