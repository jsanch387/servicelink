import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockPro = vi.fn();
const mockRateLimit = vi.fn();
const mockAccount = vi.fn();
const mockList = vi.fn();
const mockBalance = vi.fn();
const mockEnrich = vi.fn();
const mockOffline = vi.fn();

vi.mock(
  '@/features/availability/booking/server/resolveTapToPayRouteAuth',
  () => ({
    resolveTapToPayRouteAuth: (...args: unknown[]) => mockAuth(...args),
  })
);

vi.mock('@/features/payments/server/getHasProAccessForPayments', () => ({
  getHasProAccessForPayments: (...args: unknown[]) => mockPro(...args),
}));

vi.mock('@/server/rateLimit/ownerPaymentsTransactionsRateLimit', () => ({
  assertOwnerPaymentsTransactionsRateLimits: (...args: unknown[]) =>
    mockRateLimit(...args),
}));

vi.mock('../resolveMerchantTransactionsAccount', () => ({
  resolveMerchantTransactionsAccount: (...args: unknown[]) =>
    mockAccount(...args),
}));

vi.mock('../enrichPaymentsTransactions', () => ({
  enrichPaymentsTransactions: (...args: unknown[]) => mockEnrich(...args),
}));

vi.mock('../loadOfflineSessionPayments', () => ({
  loadOfflineSessionPayments: (...args: unknown[]) => mockOffline(...args),
}));

vi.mock('@/libs/stripe', () => ({
  getStripeConnectClient: () => ({
    balanceTransactions: { list: mockList },
    balance: { retrieve: mockBalance },
  }),
}));

import { listOwnerPaymentsTransactions } from '../listOwnerPaymentsTransactions';

function makeRequest(query = ''): NextRequest {
  return {
    nextUrl: { searchParams: new URLSearchParams(query) },
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('listOwnerPaymentsTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      ok: true,
      user: { id: 'user_1' },
      supabase: {},
      business: { id: 'biz_1', business_name: 'Acme' },
    });
    mockPro.mockResolvedValue(true);
    mockRateLimit.mockResolvedValue({ ok: true });
    mockAccount.mockResolvedValue({ ok: true, stripeAccountId: 'acct_123' });
    mockEnrich.mockImplementation(
      async (_supabase: unknown, _businessId: string, items: unknown[]) => items
    );
    mockOffline.mockResolvedValue({ ok: true, rows: [], hasMore: false });
    mockList.mockResolvedValue({
      data: [
        {
          id: 'txn_1',
          amount: 4000,
          fee: 146,
          net: 3854,
          currency: 'usd',
          type: 'charge',
          status: 'available',
          created: 1_700_000_000,
          available_on: 1_700_086_400,
          description: 'Lights',
          source: {
            object: 'charge',
            payment_intent: 'pi_1',
            metadata: { kind: 'walkup_payment_link', note: 'Lights' },
          },
        },
      ],
      has_more: false,
    });
    mockBalance.mockResolvedValue({
      available: [{ amount: 12_000, currency: 'usd' }],
      pending: [{ amount: 3_000, currency: 'usd' }],
    });
  });

  it('returns 401 when signed out', async () => {
    mockAuth.mockResolvedValue({
      ok: false,
      httpStatus: 401,
      error: 'Authentication required',
    });
    const result = await listOwnerPaymentsTransactions(makeRequest());
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 401,
      error: 'Sign in again to view transactions.',
    });
  });

  it('returns 403 when the owner is not Pro', async () => {
    mockPro.mockResolvedValue(false);
    const result = await listOwnerPaymentsTransactions(makeRequest());
    expect(result).toMatchObject({
      ok: false,
      httpStatus: 403,
      error: 'Upgrade to Pro to view transactions.',
    });
  });

  it('returns offline collections when Connect is not ready', async () => {
    mockAccount.mockResolvedValue({
      ok: false,
      httpStatus: 422,
      error: 'Set up Stripe payments to view transactions.',
    });
    mockOffline.mockResolvedValue({
      ok: true,
      hasMore: false,
      rows: [
        {
          id: 'bp_1',
          bookingId: 'book_1',
          method: 'cash',
          amountCents: 5000,
          currency: 'usd',
          recordedAt: '2026-08-24T17:00:00.000Z',
          customerName: 'Jordan Lee',
          serviceName: 'Lights',
        },
      ],
    });
    const result = await listOwnerPaymentsTransactions(makeRequest());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(mockList).not.toHaveBeenCalled();
    expect(result.balance.availableCents).toBe(0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'local_bp_bp_1',
      source: 'cash',
      title: 'Lights',
      extraCount: 0,
      amountLabel: '+$50.00',
    });
  });

  it('merges cash jobs with Stripe charges', async () => {
    mockOffline.mockResolvedValue({
      ok: true,
      hasMore: false,
      rows: [
        {
          id: 'bp_1',
          bookingId: 'book_1',
          method: 'payment_app',
          amountCents: 2000,
          currency: 'usd',
          recordedAt: '2026-08-24T18:00:00.000Z',
          customerName: 'Pat',
          serviceName: 'Wax',
        },
      ],
    });
    const result = await listOwnerPaymentsTransactions(makeRequest());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.map(item => item.id)).toEqual([
      'local_bp_bp_1',
      'txn_1',
    ]);
    expect(result.items[0]).toMatchObject({
      source: 'payment_app',
      title: 'Wax',
      subtitle: 'Pat · Payment app',
    });
  });

  it('returns balance and mapped items from the connected account', async () => {
    const result = await listOwnerPaymentsTransactions(makeRequest());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.balance).toEqual({
      availableCents: 12_000,
      pendingCents: 3_000,
      currency: 'usd',
      availableLabel: '$120.00',
      pendingLabel: '$30.00',
      availableCaption: 'Available',
      pendingCaption: 'On the way',
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'txn_1',
      kind: 'payment',
      source: 'payment_link',
      title: 'Lights',
      extraCount: 0,
      displayAmountCents: 3854,
      tone: 'in',
      amountLabel: '+$38.54',
      statusLabel: 'Paid',
    });
    expect(result.items[0]).not.toHaveProperty('refs');
    expect(result.items[0]).not.toHaveProperty('cardLast4');
    expect(result.items[0]).not.toHaveProperty('bankLast4');
    expect(result.items[0]).not.toHaveProperty('description');
    expect(result.hasMore).toBe(false);
    expect(mockList).toHaveBeenCalled();
  });
});
