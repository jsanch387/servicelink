import { parseBookingCheckoutDraftPayload } from '@/features/availability/booking/utils/parseBookingCheckoutDraftPayload';
import { describe, expect, it } from 'vitest';

function validCheckoutBookingPayload(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    businessSlug: 'acme-detail',
    businessId: 'biz-1',
    serviceName: 'Full Detail',
    durationMinutes: 60,
    scheduledDate: '2026-09-30',
    startTime: '10:00',
    customer: {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '5551234567',
    },
    totalPriceCents: 15000,
    requiredOnlineAmountCents: 5000,
    paymentMethodSelected: 'pay_now',
    ...overrides,
  };
}

describe('parseBookingCheckoutDraftPayload', () => {
  it('keeps agreedToPolicy so checkout can honor an earlier accept', () => {
    const parsed = parseBookingCheckoutDraftPayload(
      validCheckoutBookingPayload({ agreedToPolicy: true })
    );
    expect(parsed?.agreedToPolicy).toBe(true);
  });

  it('does not treat a missing or non-boolean accept as agreed', () => {
    expect(
      parseBookingCheckoutDraftPayload(validCheckoutBookingPayload())
        ?.agreedToPolicy
    ).toBeUndefined();
    expect(
      parseBookingCheckoutDraftPayload(
        validCheckoutBookingPayload({ agreedToPolicy: 'true' })
      )?.agreedToPolicy
    ).toBeUndefined();
    expect(
      parseBookingCheckoutDraftPayload(
        validCheckoutBookingPayload({ agreedToPolicy: false })
      )?.agreedToPolicy
    ).toBeUndefined();
  });

  it('keeps SMS opt-out from the same checkout payload', () => {
    const parsed = parseBookingCheckoutDraftPayload(
      validCheckoutBookingPayload({ agreedToNotifications: false })
    );
    expect(parsed?.agreedToNotifications).toBe(false);
  });
});
