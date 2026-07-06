import { handleJobCompletedAction } from '@/features/availability/booking/server/handleJobCompletedAction';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSupabaseAdminClientMock = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

vi.mock('@/server/rateLimit/ownerSmsSendRateLimit', () => ({
  assertOwnerSmsSendRateLimits: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock(
  '@/features/availability/booking/server/persistJobCompletedTransaction',
  () => ({
    persistJobCompletedTransaction: vi.fn(),
  })
);

vi.mock(
  '@/features/availability/booking/server/verifyTapToPayPaymentIntent',
  () => ({
    verifyTapToPayPaymentIntent: vi.fn(),
  })
);

vi.mock(
  '@/features/availability/booking/server/resolveTapToPayBookingContext',
  () => ({
    resolveTapToPayBookingContext: vi.fn(),
  })
);

function makeAuthSupabase(config: {
  booking: Record<string, unknown>;
  bookingPayments?: Record<string, unknown> | null;
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: config.booking, error: null }),
            }),
          }),
        };
      }
      if (table === 'booking_payments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: config.bookingPayments ?? null,
                  error: null,
                }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
}

describe('handleJobCompletedAction tap_to_pay idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { public_token: 'inv-token' },
                error: null,
              }),
          }),
        }),
      })),
    });
  });

  it('returns 409 when a completed booking receives a different tap PI', async () => {
    const supabase = makeAuthSupabase({
      booking: {
        id: 'booking-1',
        business_id: 'biz-1',
        status: 'completed',
        job_status: 'completed',
        work_handoff_status: 'notified',
        service_price_cents: 10000,
        addon_details: [],
      },
      bookingPayments: {
        session_payment_stripe_payment_intent_id: 'pi_original',
      },
    });

    const response = await handleJobCompletedAction({
      request: new NextRequest('http://localhost/actions'),
      bookingId: 'booking-1',
      rawBody: {
        action: 'job_completed',
        sessionPayment: {
          method: 'tap_to_pay',
          amountCents: 10000,
          stripePaymentIntentId: 'pi_different',
        },
      },
      auth: { user: { id: 'user-1' }, supabase: supabase as never },
      business: { id: 'biz-1', business_name: 'Acme' },
    });

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/different payment/i);
  });

  it('returns 200 idempotently when the same tap PI is retried', async () => {
    const supabase = makeAuthSupabase({
      booking: {
        id: 'booking-1',
        business_id: 'biz-1',
        status: 'completed',
        job_status: 'completed',
        work_handoff_status: 'notified',
        service_price_cents: 10000,
        addon_details: [],
      },
      bookingPayments: {
        session_payment_stripe_payment_intent_id: 'pi_same',
      },
    });

    const response = await handleJobCompletedAction({
      request: new NextRequest('http://localhost/actions'),
      bookingId: 'booking-1',
      rawBody: {
        action: 'job_completed',
        sessionPayment: {
          method: 'tap_to_pay',
          amountCents: 10000,
          stripePaymentIntentId: 'pi_same',
        },
      },
      auth: { user: { id: 'user-1' }, supabase: supabase as never },
      business: { id: 'biz-1', business_name: 'Acme' },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.invoicePublicToken).toBe('inv-token');
  });
});
