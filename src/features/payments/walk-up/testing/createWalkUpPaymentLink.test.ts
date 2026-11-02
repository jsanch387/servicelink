import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockRateLimit = vi.fn();
const mockResolveAccount = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock(
  '@/features/availability/booking/server/resolveTapToPayRouteAuth',
  () => ({
    resolveTapToPayRouteAuth: (...args: unknown[]) => mockAuth(...args),
  })
);

vi.mock('@/server/rateLimit/ownerWalkUpPaymentLinkRateLimit', () => ({
  assertOwnerWalkUpPaymentLinkRateLimits: (...args: unknown[]) =>
    mockRateLimit(...args),
  WALKUP_PAYMENT_LINK_RATE_LIMIT_ERROR:
    'Too many payment links. Please wait a moment and try again.',
}));

vi.mock('../resolveMerchantWalkUpPaymentAccount', () => ({
  resolveMerchantWalkUpPaymentAccount: (...args: unknown[]) =>
    mockResolveAccount(...args),
}));

vi.mock('@/libs/stripe/appBaseUrl', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

vi.mock('@/libs/stripe/platformClient', () => ({
  getStripePlatform: () => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
  }),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockAdminFrom }),
}));

import { createWalkUpPaymentLink } from '../createWalkUpPaymentLink';

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('createWalkUpPaymentLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      ok: true,
      user: { id: 'user_1' },
      supabase: {},
      business: { id: 'biz_1', business_name: 'Acme Detail' },
    });
    mockRateLimit.mockResolvedValue({ ok: true });
    mockResolveAccount.mockResolvedValue({
      ok: true,
      stripeAccountId: 'acct_123',
    });
  });

  it('returns 401 when the owner is signed out', async () => {
    mockAuth.mockResolvedValue({
      ok: false,
      httpStatus: 401,
      error: 'Authentication required',
    });

    const result = await createWalkUpPaymentLink(
      makeRequest({ amountCents: 4000, note: 'Lights' })
    );
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 401,
      error: 'Sign in again to create a payment link.',
    });
  });

  it('returns 400 for an invalid body', async () => {
    const result = await createWalkUpPaymentLink(
      makeRequest({ amountCents: 0, note: 'Lights' })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.httpStatus).toBe(400);
  });

  it('creates a Checkout Session on the connected account and returns the URL', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'req_1' },
      error: null,
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockAdminFrom.mockImplementation((table: string) => {
      if (table !== 'payment_requests') {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: insertSingle }),
        }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      };
    });
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_live',
      url: 'https://checkout.stripe.com/c/pay/cs_test_live',
    });

    const result = await createWalkUpPaymentLink(
      makeRequest({
        amountCents: 4000,
        currency: 'usd',
        note: 'Lights',
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.paymentLinkId).toBe('cs_test_live');
    expect(result.paymentRequestId).toBe('req_1');
    expect(result.url).toMatch(
      /^https:\/\/myservicelink\.app\/p\/[A-Za-z0-9]+$/
    );
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
    const [params, options] = mockCheckoutCreate.mock.calls[0] as [
      {
        metadata?: { kind?: string };
        mode?: string;
        success_url?: string;
        cancel_url?: string;
      },
      { stripeAccount?: string },
    ];
    expect(params.mode).toBe('payment');
    expect(params.metadata?.kind).toBe('walkup_payment_link');
    expect(params.success_url).toBe(
      'https://myservicelink.app/pay/complete?status=success'
    );
    expect(params.cancel_url).toBe(result.url);
    expect(options.stripeAccount).toBe('acct_123');
  });
});
