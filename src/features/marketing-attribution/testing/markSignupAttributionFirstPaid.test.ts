import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMetaCapiEvent } = vi.hoisted(() => ({
  sendMetaCapiEvent: vi.fn(async () => ({ sent: false })),
}));

vi.mock('@/features/analytics/server/sendMetaCapiEvent', () => ({
  sendMetaCapiEvent,
}));

import { markSignupAttributionFirstPaid } from '../server/markSignupAttributionFirstPaid';

type AttributionRow = {
  user_id: string;
  first_paid_at: string | null;
} | null;

function buildSupabase(options: {
  profile: Record<string, unknown> | null;
  attribution: AttributionRow;
  insertConflict?: boolean;
}) {
  let attribution = options.attribution;
  const inserted: unknown[] = [];

  const from = (table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: options.profile, error: null }),
          }),
        }),
      };
    }

    return {
      update: (payload: { first_paid_at: string }) => ({
        eq: () => ({
          is: () => ({
            select: async () => {
              if (!attribution || attribution.first_paid_at) {
                return { data: [], error: null };
              }
              attribution = {
                ...attribution,
                first_paid_at: payload.first_paid_at,
              };
              return { data: [{ user_id: attribution.user_id }], error: null };
            },
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: attribution, error: null }),
        }),
      }),
      insert: (row: unknown) => {
        inserted.push(row);
        if (options.insertConflict) {
          attribution = { user_id: 'user-1', first_paid_at: null };
          return Promise.resolve({
            error: { message: 'duplicate', code: '23505' },
            data: null,
          });
        }
        const record = row as { user_id: string; first_paid_at: string | null };
        attribution = {
          user_id: record.user_id,
          first_paid_at: record.first_paid_at,
        };
        return Promise.resolve({ error: null, data: null });
      },
    };
  };

  return {
    client: { from },
    inserted,
    attribution: () => attribution,
  };
}

const paidProfile = {
  user_id: 'user-1',
  created_at: '2026-09-02T15:00:00.000Z',
  subscription_tier: 'pro',
  subscription_status: 'active',
  stripe_subscription_id: 'sub_1',
};

describe('markSignupAttributionFirstPaid', () => {
  beforeEach(() => {
    sendMetaCapiEvent.mockClear();
  });

  it('stamps first_paid_at once for a paid active Pro and fires Subscribe', async () => {
    const supabase = buildSupabase({
      profile: paidProfile,
      attribution: { user_id: 'user-1', first_paid_at: null },
    });

    await expect(
      markSignupAttributionFirstPaid(supabase.client as never, {
        userId: 'user-1',
      })
    ).resolves.toEqual({ stamped: true });

    expect(supabase.attribution()?.first_paid_at).toEqual(expect.any(String));
    expect(sendMetaCapiEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'Subscribe', userId: 'user-1' })
    );
  });

  it('skips trials', async () => {
    const supabase = buildSupabase({
      profile: { ...paidProfile, subscription_status: 'trialing' },
      attribution: { user_id: 'user-1', first_paid_at: null },
    });

    await expect(
      markSignupAttributionFirstPaid(supabase.client as never, {
        userId: 'user-1',
      })
    ).resolves.toEqual({
      stamped: false,
      skippedReason: 'not_paid_active_pro',
    });
    expect(sendMetaCapiEvent).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing first_paid_at or fire Subscribe again', async () => {
    const supabase = buildSupabase({
      profile: paidProfile,
      attribution: {
        user_id: 'user-1',
        first_paid_at: '2026-08-01T00:00:00.000Z',
      },
    });

    await expect(
      markSignupAttributionFirstPaid(supabase.client as never, {
        userId: 'user-1',
      })
    ).resolves.toEqual({
      stamped: false,
      skippedReason: 'already_stamped',
    });
    expect(supabase.attribution()?.first_paid_at).toBe(
      '2026-08-01T00:00:00.000Z'
    );
    expect(sendMetaCapiEvent).not.toHaveBeenCalled();
  });

  it('inserts an unknown row when attribution is missing', async () => {
    const supabase = buildSupabase({
      profile: paidProfile,
      attribution: null,
    });

    await expect(
      markSignupAttributionFirstPaid(supabase.client as never, {
        userId: 'user-1',
      })
    ).resolves.toEqual({ stamped: true });

    expect(supabase.inserted[0]).toMatchObject({
      user_id: 'user-1',
      channel: 'unknown',
      signed_up_at: '2026-09-02T15:00:00.000Z',
    });
    expect(
      (supabase.inserted[0] as { first_paid_at?: string }).first_paid_at
    ).toEqual(expect.any(String));
    expect(sendMetaCapiEvent).toHaveBeenCalledTimes(1);
  });

  it('stamps after a concurrent insert without a second Subscribe when already paid', async () => {
    const supabase = buildSupabase({
      profile: paidProfile,
      attribution: null,
      insertConflict: true,
    });

    await expect(
      markSignupAttributionFirstPaid(supabase.client as never, {
        userId: 'user-1',
      })
    ).resolves.toEqual({ stamped: true });
    expect(sendMetaCapiEvent).toHaveBeenCalledTimes(1);
  });
});
