import { resolveMerchantTapToPayPaymentAccount } from '@/features/payments/server/resolveMerchantTapToPayPaymentAccount';
import { resolveMerchantTapToPayStripeAccountId } from '@/features/payments/server/resolveMerchantTapToPayStripeAccountId';
import { describe, expect, it, vi } from 'vitest';

function makeSupabase(
  account: Record<string, unknown> | null,
  error: unknown = null
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: account, error });
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
    })),
    maybeSingle,
  };
}

describe('resolveMerchantTapToPayPaymentAccount', () => {
  it('accepts a ready Connect account', async () => {
    const supabase = makeSupabase({
      stripe_account_id: 'acct_123',
      charges_enabled: true,
      onboarding_status: 'complete',
    });

    const result = await resolveMerchantTapToPayPaymentAccount({
      supabase: supabase as never,
      businessId: 'biz-1',
    });

    expect(result).toEqual({ ok: true, stripeAccountId: 'acct_123' });
  });

  it('rejects when Connect is not complete', async () => {
    const supabase = makeSupabase({
      stripe_account_id: 'acct_123',
      charges_enabled: true,
      onboarding_status: 'pending',
    });

    const result = await resolveMerchantTapToPayPaymentAccount({
      supabase: supabase as never,
      businessId: 'biz-1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(422);
    }
  });
});

describe('resolveMerchantTapToPayStripeAccountId', () => {
  it('accepts matching stripeAccountId', () => {
    const result = resolveMerchantTapToPayStripeAccountId({
      merchantStripeAccountId: 'acct_123',
      requestedStripeAccountId: 'acct_123',
    });
    expect(result).toEqual({ ok: true, stripeAccountId: 'acct_123' });
  });

  it('rejects mismatched stripeAccountId with 403', () => {
    const result = resolveMerchantTapToPayStripeAccountId({
      merchantStripeAccountId: 'acct_123',
      requestedStripeAccountId: 'acct_other',
    });
    expect(result).toEqual({
      ok: false,
      httpStatus: 403,
      error: 'Not authorized for this Stripe account.',
    });
  });

  it('accepts empty request body account', () => {
    const result = resolveMerchantTapToPayStripeAccountId({
      merchantStripeAccountId: 'acct_123',
    });
    expect(result).toEqual({ ok: true, stripeAccountId: 'acct_123' });
  });
});
