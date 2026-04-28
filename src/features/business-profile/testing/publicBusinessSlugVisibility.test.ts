import { describe, expect, it, vi } from 'vitest';

import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import type { PublicProfileLiveOwnerFields } from '@/features/pricing/utils/publicBusinessProfileLive';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Minimal Supabase chain mock: `from(table)` then `.select().eq().maybeSingle()`.
 * Routes `maybeSingle` result by last `from()` table name.
 */
function createAdminClientMock(scenario: {
  business: { profile_id: string | null } | null;
  businessError?: { message: string } | null;
  owner: PublicProfileLiveOwnerFields | null;
}): SupabaseClient {
  let currentTable = '';

  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => {
      if (currentTable === 'business_profiles') {
        return {
          data: scenario.business,
          error: scenario.businessError ?? null,
        };
      }
      if (currentTable === 'profiles') {
        return { data: scenario.owner, error: null };
      }
      return { data: null, error: null };
    }),
  };

  return {
    from: vi.fn((table: string) => {
      currentTable = table;
      return chain;
    }),
  } as unknown as SupabaseClient;
}

const BILLED = 'sub_test';
const CUS = 'cus_test';

describe('isPublicBusinessSlugVisible', () => {
  it('returns false for empty slug', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: { onboarding_status: 'completed', subscription_tier: 'free' },
    });
    expect(await isPublicBusinessSlugVisible(admin, '   ')).toBe(false);
  });

  it('returns false when business row is missing', async () => {
    const admin = createAdminClientMock({
      business: null,
      owner: { onboarding_status: 'completed', subscription_tier: 'free' },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'acme-detail')).toBe(
      false
    );
  });

  it('returns false when business query errors', async () => {
    const admin = createAdminClientMock({
      business: null,
      businessError: { message: 'db error' },
      owner: { onboarding_status: 'completed', subscription_tier: 'free' },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'acme-detail')).toBe(
      false
    );
  });

  it('returns true when profile_id is missing (legacy row)', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: null },
      owner: { onboarding_status: 'completed', subscription_tier: 'free' },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'legacy-slug')).toBe(
      true
    );
  });

  it('returns false when owner row is missing', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: null,
    });
    expect(await isPublicBusinessSlugVisible(admin, 'orphan-slug')).toBe(
      false
    );
  });

  it('returns true for grandfathered free (completed, no Stripe history)', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'grandpa')).toBe(true);
  });

  it('returns true for billed Pro trialing with completed onboarding', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'trialing',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'trial-pro')).toBe(true);
  });

  it('returns true for comped Pro (no Stripe ids)', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'comped')).toBe(true);
  });

  it('returns false when onboarding is not completed', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'in_progress',
        subscription_tier: 'free',
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'abandoned')).toBe(
      false
    );
  });

  it('returns false for free tier with Stripe billing history (churned)', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'completed',
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        stripe_customer_id: CUS,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'churned')).toBe(false);
  });

  it('returns false for Pro tier but revoked Stripe status', async () => {
    const admin = createAdminClientMock({
      business: { profile_id: 'user-1' },
      owner: {
        onboarding_status: 'completed',
        subscription_tier: 'pro',
        subscription_current_period_end: null,
        subscription_status: 'canceled',
        stripe_subscription_id: BILLED,
        stripe_customer_id: CUS,
      },
    });
    expect(await isPublicBusinessSlugVisible(admin, 'canceled-pro')).toBe(
      false
    );
  });
});
