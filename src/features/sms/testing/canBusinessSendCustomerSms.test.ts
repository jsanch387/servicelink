import { describe, expect, it, vi } from 'vitest';
import { canBusinessSendCustomerSms } from '../server/canBusinessSendCustomerSms';

function makeAdmin(opts: {
  profileId?: string | null;
  profileRow?: Record<string, unknown> | null;
  email?: string | null;
  bizError?: unknown;
  profileError?: unknown;
}) {
  const getUserById = vi.fn().mockResolvedValue({
    data: { user: opts.email ? { email: opts.email } : null },
    error: null,
  });

  const admin = {
    from: vi.fn((table: string) => {
      if (table === 'business_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data:
                    opts.profileId === undefined
                      ? { profile_id: 'user-1' }
                      : opts.profileId
                        ? { profile_id: opts.profileId }
                        : null,
                  error: opts.bizError ?? null,
                }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: opts.profileRow ?? {
                    subscription_tier: 'pro',
                    subscription_current_period_end: null,
                    subscription_status: 'active',
                    stripe_subscription_id: 'sub_1',
                    stripe_customer_id: 'cus_1',
                  },
                  error: opts.profileError ?? null,
                }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    auth: { admin: { getUserById } },
  };

  return { admin, getUserById };
}

describe('canBusinessSendCustomerSms', () => {
  it('allows free and Pro owners when the rollout allowlist is empty', async () => {
    const { admin, getUserById } = makeAdmin({
      email: 'anyone@example.com',
      profileRow: {
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: true });
    expect(getUserById).not.toHaveBeenCalled();
  });

  it('rejects when business has no profile_id', async () => {
    const { admin } = makeAdmin({ profileId: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: false, reason: 'no_owner' });
  });

  it('rejects an empty business id', async () => {
    const { admin } = makeAdmin({});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, '  ');

    expect(res).toEqual({ ok: false, reason: 'no_owner' });
  });
});
