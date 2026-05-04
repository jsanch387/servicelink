import { maintenanceCustomerPaymentOptions } from '@/features/maintenance/server/maintenancePaymentEligibility';
import { describe, expect, it } from 'vitest';

describe('[Maintenance] maintenanceCustomerPaymentOptions', () => {
  const stripeReady = {
    checkoutMode: 'customer_choice' as const,
    paymentsEnabled: true,
    chargesEnabled: true,
    ownerHasProForPayments: true,
  };

  it('shows card + in person when Stripe is ready and mode is customer_choice', () => {
    expect(maintenanceCustomerPaymentOptions(stripeReady)).toEqual({
      showPayWithCard: true,
      showPayInPerson: true,
    });
  });

  it('shows only in person when mode is in_person', () => {
    expect(
      maintenanceCustomerPaymentOptions({
        ...stripeReady,
        checkoutMode: 'in_person',
      })
    ).toEqual({ showPayWithCard: false, showPayInPerson: true });
  });

  it('shows only in person when Stripe is not ready even for in_app mode', () => {
    expect(
      maintenanceCustomerPaymentOptions({
        checkoutMode: 'in_app',
        paymentsEnabled: false,
        chargesEnabled: false,
        ownerHasProForPayments: false,
      })
    ).toEqual({ showPayWithCard: false, showPayInPerson: true });
  });

  it('shows card for in_app when Stripe is ready', () => {
    expect(
      maintenanceCustomerPaymentOptions({
        ...stripeReady,
        checkoutMode: 'in_app',
      })
    ).toEqual({ showPayWithCard: true, showPayInPerson: false });
  });

  it('shows in person when checkout mode is unknown (null)', () => {
    expect(
      maintenanceCustomerPaymentOptions({
        checkoutMode: null,
        paymentsEnabled: true,
        chargesEnabled: true,
        ownerHasProForPayments: true,
      })
    ).toEqual({ showPayWithCard: false, showPayInPerson: true });
  });
});
