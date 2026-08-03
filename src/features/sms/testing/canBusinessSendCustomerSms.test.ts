import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canBusinessSendCustomerSms } from '../server/canBusinessSendCustomerSms';

const { isProAccessMock } = vi.hoisted(() => ({
  isProAccessMock: vi.fn(),
}));

vi.mock('@/features/pricing/utils/isProAccess', () => ({
  isProAccess: isProAccessMock,
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    isProAccessMock.mockReturnValue(true);
  });

  it('allows Pro owner on the rollout allowlist', async () => {
    const { admin, getUserById } = makeAdmin({
      email: 'jesuss387@gmail.com',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: true });
    expect(getUserById).toHaveBeenCalledWith('user-1');
  });

  it('rejects non-Pro owners', async () => {
    isProAccessMock.mockReturnValue(false);
    const { admin } = makeAdmin({ email: 'jesuss387@gmail.com' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: false, reason: 'not_pro' });
  });

  it('rejects Pro owners not on the rollout allowlist', async () => {
    const { admin } = makeAdmin({ email: 'other@example.com' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: false, reason: 'not_in_rollout' });
  });

  it('rejects when business has no profile_id', async () => {
    const { admin } = makeAdmin({ profileId: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await canBusinessSendCustomerSms(admin as any, 'biz-1');

    expect(res).toEqual({ ok: false, reason: 'not_pro' });
  });
});
