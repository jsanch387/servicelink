import { describe, expect, it } from 'vitest';

import { isPublicBusinessProfileLive } from '../utils/publicBusinessProfileLive';

const BILLED = 'sub_x';
const CUS = 'cus_x';

describe('isPublicBusinessProfileLive', () => {
  it.each([
    ['in_progress' as const],
    ['not_started' as const],
    [null],
    [undefined],
    ['' as const],
  ])('is false when onboarding is not completed (%s)', onboarding_status => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: onboarding_status as string | null | undefined,
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'active',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(false);
  });

  it('is true for completed onboarding + active billed Pro', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'active',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(true);
  });

  it('is true for completed onboarding + trialing billed Pro', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'trialing',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(true);
  });

  it('is true for completed onboarding + comped Pro (no Stripe)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(true);
  });

  it('is true for grandfathered free (completed, no Stripe history)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(true);
  });

  it('is true for grandfathered when tier is null (treated as free) and no Stripe history', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: null,
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(true);
  });

  it('is false for free tier when only subscription_status is set (Stripe lifecycle)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(false);
  });

  it('is false for free tier with subscription id only (billing history)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: BILLED,
        stripe_customer_id: null,
      })
    ).toBe(false);
  });

  it('is false for churned free with Stripe customer id', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        stripe_customer_id: CUS,
      })
    ).toBe(false);
  });

  it('is false for completed onboarding but Pro access revoked (past_due)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'past_due',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(false);
  });

  it('is false for pro tier with Stripe customer but no subscription (not comped)', () => {
    expect(
      isPublicBusinessProfileLive({
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: CUS,
      })
    ).toBe(false);
  });
});
