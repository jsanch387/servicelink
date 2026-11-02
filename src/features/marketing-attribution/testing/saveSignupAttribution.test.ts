import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminState = vi.hoisted(() => ({
  existing: null as Record<string, unknown> | null,
  insertCalls: [] as unknown[],
  updateCalls: [] as unknown[],
  insertError: null as { code?: string; message: string } | null,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: adminState.existing,
            error: null,
          }),
        }),
      }),
      insert: (row: unknown) => {
        adminState.insertCalls.push(row);
        return Promise.resolve({ error: adminState.insertError, data: null });
      },
      update: (payload: unknown) => {
        adminState.updateCalls.push(payload);
        const chain = {
          eq: () => chain,
          is: () => chain,
          select: async () => ({ data: [{ user_id: 'user-1' }], error: null }),
        };
        return chain;
      },
    }),
  }),
}));

import { saveSignupAttribution } from '../server/saveSignupAttribution';

function profileClient(createdAt: string) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({
                data: { created_at: createdAt },
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  };
}

const freshProfile = new Date().toISOString();
const oldProfile = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

const placeholder = {
  user_id: 'user-1',
  channel: 'unknown',
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  fbclid: null,
  gclid: null,
  landing_path: null,
  referrer: null,
};

describe('saveSignupAttribution', () => {
  beforeEach(() => {
    adminState.existing = null;
    adminState.insertCalls = [];
    adminState.updateCalls = [];
    adminState.insertError = null;
  });

  it('still refuses browser UTMs after 48 hours', async () => {
    const result = await saveSignupAttribution(
      profileClient(oldProfile) as never,
      'user-1',
      { utmSource: 'meta', utmMedium: 'paid', utmCampaign: 'sept' }
    );

    expect(result).toEqual({ ok: true, recorded: false });
    expect(adminState.insertCalls).toHaveLength(0);
    expect(adminState.updateCalls).toHaveLength(0);
  });

  it('does not overwrite a real first-touch row', async () => {
    adminState.existing = {
      ...placeholder,
      channel: 'meta_ads',
      utm_source: 'meta',
    };

    const result = await saveSignupAttribution(
      profileClient(freshProfile) as never,
      'user-1',
      { utmSource: 'google', utmMedium: 'cpc' }
    );

    expect(result).toEqual({ ok: true, recorded: false });
    expect(adminState.updateCalls).toHaveLength(0);
  });

  it('upgrades an unknown placeholder with browser UTMs inside 48 hours', async () => {
    adminState.existing = placeholder;

    const result = await saveSignupAttribution(
      profileClient(freshProfile) as never,
      'user-1',
      {
        utmSource: 'meta',
        utmMedium: 'paid',
        utmCampaign: 'sept',
        fbclid: 'click',
      }
    );

    expect(result).toEqual({ ok: true, recorded: true });
    expect(adminState.updateCalls[0]).toMatchObject({
      channel: 'meta_ads',
      utm_source: 'meta',
      utm_campaign: 'sept',
      fbclid: 'click',
    });
    expect(adminState.insertCalls).toHaveLength(0);
  });

  it('inserts browser UTMs when no row exists yet', async () => {
    const result = await saveSignupAttribution(
      profileClient(freshProfile) as never,
      'user-1',
      { utmSource: 'meta', utmMedium: 'paid', utmCampaign: 'sept' }
    );

    expect(result).toEqual({ ok: true, recorded: true });
    expect(adminState.insertCalls[0]).toMatchObject({
      user_id: 'user-1',
      channel: 'meta_ads',
      utm_campaign: 'sept',
    });
  });
});
