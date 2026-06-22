import { verifyTapToPayPaymentIntent } from '@/features/availability/booking/server/verifyTapToPayPaymentIntent';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const retrieveMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock('@/libs/stripe', () => ({
  getStripeConnectClient: () => ({
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

function mockAdminWithIntentRow(intentRow: Record<string, unknown> | null) {
  adminFromMock.mockImplementation((table: string) => {
    if (table === 'booking_payments') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'booking_tap_to_pay_intents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: intentRow }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

describe('verifyTapToPayPaymentIntent', () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    adminFromMock.mockReset();
  });

  it('accepts a succeeded payment intent verified against the DB intent row', async () => {
    mockAdminWithIntentRow({
      booking_id: 'booking-1',
      business_id: 'business-1',
      amount_cents: 12000,
    });
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
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.amountCents).toBe(12000);
    }
  });

  it('rejects when Stripe amount does not match the DB intent row', async () => {
    mockAdminWithIntentRow({
      booking_id: 'booking-1',
      business_id: 'business-1',
      amount_cents: 12000,
    });
    retrieveMock.mockResolvedValue({
      status: 'succeeded',
      amount: 10000,
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/amount does not match/i);
    }
  });

  it('rejects when payment has not succeeded', async () => {
    mockAdminWithIntentRow({
      booking_id: 'booking-1',
      business_id: 'business-1',
      amount_cents: 12000,
    });
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(400);
      expect(result.error).toContain('not completed');
    }
  });

  it('rejects when PI is already used on another booking', async () => {
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'booking_payments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { booking_id: 'other-booking' },
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await verifyTapToPayPaymentIntent({
      bookingId: 'booking-1',
      businessId: 'business-1',
      stripeAccountId: 'acct_123',
      paymentIntentId: 'pi_123',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
    }
    expect(retrieveMock).not.toHaveBeenCalled();
  });
});
