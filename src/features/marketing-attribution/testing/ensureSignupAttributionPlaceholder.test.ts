import { describe, expect, it } from 'vitest';

import { ensureSignupAttributionPlaceholder } from '../server/ensureSignupAttributionPlaceholder';

function adminFor(state: {
  existing: { user_id: string } | null;
  profile: { created_at: string } | null;
  inserted: unknown[];
}) {
  return {
    from(table: string) {
      if (table === 'signup_attribution') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.existing, error: null }),
            }),
          }),
          insert: (row: unknown) => {
            state.inserted.push(row);
            return Promise.resolve({ error: null, data: null });
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: state.profile, error: null }),
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe('ensureSignupAttributionPlaceholder', () => {
  it('inserts unknown for an older profile with no row', async () => {
    const state = {
      existing: null,
      profile: { created_at: '2026-04-01T00:00:00.000Z' },
      inserted: [] as unknown[],
    };

    await expect(
      ensureSignupAttributionPlaceholder(adminFor(state) as never, 'user-1')
    ).resolves.toEqual({ inserted: true });

    expect(state.inserted[0]).toMatchObject({
      user_id: 'user-1',
      channel: 'unknown',
      signed_up_at: '2026-04-01T00:00:00.000Z',
    });
    expect(state.inserted[0]).not.toHaveProperty('first_paid_at');
  });

  it('does not overwrite an existing row', async () => {
    const state = {
      existing: { user_id: 'user-1' },
      profile: { created_at: '2026-09-01T00:00:00.000Z' },
      inserted: [] as unknown[],
    };

    await expect(
      ensureSignupAttributionPlaceholder(adminFor(state) as never, 'user-1')
    ).resolves.toEqual({ inserted: false, skippedReason: 'already_exists' });
    expect(state.inserted).toHaveLength(0);
  });
});
