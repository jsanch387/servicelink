import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockRateLimit = vi.fn();
const mockResolveAccount = vi.fn();
const mockEnsureTerminal = vi.fn();
const mockPaymentIntentsCreate = vi.fn();
const mockPaymentIntentsCancel = vi.fn();
const mockVerifyScope = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock(
  '@/features/availability/booking/server/resolveTapToPayRouteAuth',
  () => ({
    resolveTapToPayRouteAuth: (...args: unknown[]) => mockAuth(...args),
  })
);

vi.mock('@/server/rateLimit/ownerTapToPayRateLimit', () => ({
  assertOwnerTapToPayIntentRateLimits: (...args: unknown[]) =>
    mockRateLimit(...args),
  TAP_TO_PAY_RATE_LIMIT_ERROR:
    'Too many Tap to Pay requests. Please wait a moment and try again.',
}));

vi.mock(
  '@/features/payments/server/resolveMerchantTapToPayPaymentAccount',
  () => ({
    resolveMerchantTapToPayPaymentAccount: (...args: unknown[]) =>
      mockResolveAccount(...args),
  })
);

vi.mock('@/features/payments/server/ensureTerminalLocation', () => ({
  ensureTerminalLocation: (...args: unknown[]) => mockEnsureTerminal(...args),
}));

vi.mock('@/libs/stripe', () => ({
  getStripeConnectClient: () => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      cancel: mockPaymentIntentsCancel,
    },
  }),
}));

vi.mock(
  '@/features/availability/booking/server/verifyTapToPayDirectChargeOnConnectedAccount',
  () => ({
    verifyTapToPayDirectChargeOnConnectedAccount: (...args: unknown[]) =>
      mockVerifyScope(...args),
  })
);

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockAdminFrom }),
}));

import { createWalkUpTapToPayIntent } from '../createWalkUpTapToPayIntent';

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
  } as unknown as NextRequest;
}

function mockPaymentRequestInsert(id = 'req_1') {
  const insertSingle = vi.fn().mockResolvedValue({
    data: { id },
    error: null,
  });
  const updateEq = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
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
}

describe('createWalkUpTapToPayIntent', () => {
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
    mockEnsureTerminal.mockResolvedValue({
      ok: true,
      terminalLocationId: 'tml_abc',
      stripeAccountId: 'acct_123',
      merchantDisplayName: 'Acme Detail',
    });
    mockVerifyScope.mockResolvedValue({ ok: true });
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test_1',
      client_secret: 'pi_test_1_secret_xyz',
    });
  });

  it('returns 401 when the owner is signed out', async () => {
    mockAuth.mockResolvedValue({
      ok: false,
      httpStatus: 401,
      error: 'Authentication required',
    });

    const result = await createWalkUpTapToPayIntent(
      makeRequest({ amountCents: 4000, note: 'Lights' })
    );
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 401,
      error: 'Sign in again to collect payment.',
    });
  });

  it('returns 400 for an invalid body', async () => {
    const result = await createWalkUpTapToPayIntent(
      makeRequest({ amountCents: 0, note: 'Lights' })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.httpStatus).toBe(400);
  });

  it('returns 422 when Connect is not ready', async () => {
    mockResolveAccount.mockResolvedValue({
      ok: false,
      httpStatus: 422,
      error: 'Set up Stripe payments to use Tap to Pay.',
    });

    const result = await createWalkUpTapToPayIntent(
      makeRequest({ amountCents: 4000, note: 'Lights' })
    );
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 422,
      error: 'Set up Stripe payments to use Tap to Pay.',
    });
  });

  it('returns 500 when Terminal location is missing', async () => {
    mockEnsureTerminal.mockResolvedValue({
      ok: true,
      terminalLocationId: '',
      stripeAccountId: 'acct_123',
      merchantDisplayName: 'Acme Detail',
    });

    const result = await createWalkUpTapToPayIntent(
      makeRequest({ amountCents: 4000, note: 'Lights' })
    );
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 500,
      error: "Couldn't start Tap to Pay. Try again.",
    });
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when stripeAccountId does not match this business', async () => {
    const result = await createWalkUpTapToPayIntent(
      makeRequest({
        amountCents: 4000,
        note: 'Lights',
        stripeAccountId: 'acct_other',
      })
    );
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 403,
      error: 'Stripe account does not match this business.',
    });
  });

  it('creates a card_present PaymentIntent on the connected account', async () => {
    mockPaymentRequestInsert();

    const result = await createWalkUpTapToPayIntent(
      makeRequest({
        amountCents: 4000,
        currency: 'usd',
        note: 'Lights',
        stripeAccountId: 'acct_123',
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({
      paymentIntentId: 'pi_test_1',
      clientSecret: 'pi_test_1_secret_xyz',
      amountCents: 4000,
      currency: 'usd',
      terminalLocationId: 'tml_abc',
      stripeAccountId: 'acct_123',
      merchantDisplayName: 'Acme Detail',
    });
    expect(mockEnsureTerminal).toHaveBeenCalledTimes(1);
    expect(mockPaymentIntentsCreate).toHaveBeenCalledTimes(1);
    const [params] = mockPaymentIntentsCreate.mock.calls[0] as [
      {
        amount?: number;
        currency?: string;
        payment_method_types?: string[];
        capture_method?: string;
        description?: string;
        metadata?: { kind?: string; note?: string; paymentRequestId?: string };
      },
    ];
    expect(params.amount).toBe(4000);
    expect(params.currency).toBe('usd');
    expect(params.payment_method_types).toEqual(['card_present']);
    expect(params.capture_method).toBe('automatic');
    expect(params.description).toBe('Lights');
    expect(params.metadata?.kind).toBe('walkup_tap_to_pay');
    expect(params.metadata?.note).toBe('Lights');
    expect(params.metadata?.paymentRequestId).toBe('req_1');
  });
});
