import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyTapToPayPaymentIntent } from '@/features/availability/booking/server/verifyTapToPayPaymentIntent';

const retrieveMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock('@/libs/stripe', () => ({
  getStripePlatform: () => ({
    paymentIntents: {
      retrieve: retrieveMock,
    },
  }),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: adminFromMock,
  }),
}));

function mockAdminNoConflict() {
  adminFromMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
}

describe('verifyTapToPayPaymentIntent', () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    adminFromMock.mockReset();
  });

  it('accepts a succeeded payment intent with matching metadata', async () => {
    mockAdminNoConflict();
    retrieveMock.mockResolvedValue({
      status: 'succeeded',
      amount: 12000,
      metadata: {
        kind: 'booking_tap_to_pay',
        bookingId: 'booking-1',
        businessId: 'business-1',
      },
    });

    const result = await verifyTapToPayPaymentIntent({
      bookingId: 'booking-1',
      businessId: 'business-1',
      stripeAccountId: 'acct_123',
      paymentIntentId: 'pi_123',
      expectedAmountCents: 12000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.amountCents).toBe(12000);
    }
  });

  it('rejects when payment has not succeeded', async () => {
    mockAdminNoConflict();
    retrieveMock.mockResolvedValue({
      status: 'requires_payment_method',
      amount: 12000,
      metadata: {
        kind: 'booking_tap_to_pay',
        bookingId: 'booking-1',
        businessId: 'business-1',
      },
    });

    const result = await verifyTapToPayPaymentIntent({
      bookingId: 'booking-1',
      businessId: 'business-1',
      stripeAccountId: 'acct_123',
      paymentIntentId: 'pi_123',
      expectedAmountCents: 12000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(400);
      expect(result.error).toContain('not completed');
    }
  });

  it('rejects when PI is already used on another booking', async () => {
    adminFromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { booking_id: 'other-booking' },
            }),
          }),
        }),
      }),
    });

    const result = await verifyTapToPayPaymentIntent({
      bookingId: 'booking-1',
      businessId: 'business-1',
      stripeAccountId: 'acct_123',
      paymentIntentId: 'pi_123',
      expectedAmountCents: 12000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
    }
    expect(retrieveMock).not.toHaveBeenCalled();
  });
});
