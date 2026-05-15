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

  it('is true when onboarding is completed regardless of subscription row', () => {
    const base = {
      onboarding_status: 'completed' as const,
      subscription_current_period_end: null,
    };

    expect(
      isPublicBusinessProfileLive({
        ...base,
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(true);

    expect(
      isPublicBusinessProfileLive({
        ...base,
        subscription_tier: 'pro',
        subscription_status: 'past_due',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      })
    ).toBe(true);

    expect(
      isPublicBusinessProfileLive({
        ...base,
        subscription_tier: 'pro',
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: CUS,
      })
    ).toBe(true);

    expect(
      isPublicBusinessProfileLive({
        ...base,
        subscription_tier: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        stripe_customer_id: CUS,
      })
    ).toBe(true);

    expect(
      isPublicBusinessProfileLive({
        ...base,
        subscription_tier: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(true);
  });
});
