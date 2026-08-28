import { describe, expect, it } from 'vitest';

import { markSignupAttributionFirstPaid } from '../server/markSignupAttributionFirstPaid';

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

function buildSupabaseMock(options: {
  profile: QueryResult;
  stamp: QueryResult;
}) {
  const from = (table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => options.profile,
          }),
        }),
      };
    }
    return {
      update: () => ({
        eq: () => ({
          is: () => ({
            select: async () => options.stamp,
          }),
        }),
      }),
    };
  };
  return { from };
}

const paidProfile = {
  user_id: 'user-1',
  subscription_tier: 'pro',
  subscription_status: 'active',
  stripe_subscription_id: 'sub_1',
};

describe('markSignupAttributionFirstPaid', () => {
  it('stamps first_paid_at once for a paid active Pro', async () => {
    const supabase = buildSupabaseMock({
      profile: { data: paidProfile, error: null },
      stamp: { data: [{ user_id: 'user-1' }], error: null },
    });

    await expect(
      markSignupAttributionFirstPaid(supabase as never, { userId: 'user-1' })
    ).resolves.toEqual({ stamped: true });
  });

  it('skips trials and already-stamped rows', async () => {
    const trial = buildSupabaseMock({
      profile: {
        data: { ...paidProfile, subscription_status: 'trialing' },
        error: null,
      },
      stamp: { data: [], error: null },
    });
    await expect(
      markSignupAttributionFirstPaid(trial as never, { userId: 'user-1' })
    ).resolves.toEqual({
      stamped: false,
      skippedReason: 'not_paid_active_pro',
    });

    const already = buildSupabaseMock({
      profile: { data: paidProfile, error: null },
      stamp: { data: [], error: null },
    });
    await expect(
      markSignupAttributionFirstPaid(already as never, { userId: 'user-1' })
    ).resolves.toEqual({
      stamped: false,
      skippedReason: 'already_stamped_or_no_row',
    });
  });
});
