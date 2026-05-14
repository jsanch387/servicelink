import { getStripePlatform } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteAccountForUser } from '../server/deleteAccountForUser';

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/libs/stripe', () => ({
  getStripePlatform: vi.fn(),
}));

function makeProfilesQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

function makeBusinessQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

function makePaymentLookupQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

function makePaymentDeleteQuery(error: { message: string } | null = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const del = vi.fn(() => ({ eq }));
  return { delete: del, eq };
}

function makeStorageBucketMock() {
  const list = vi.fn().mockResolvedValue({ data: [], error: null });
  const remove = vi.fn().mockResolvedValue({ data: [], error: null });
  const storageFrom = vi.fn(() => ({ list, remove }));
  return { storageFrom, list, remove };
}

describe('deleteAccountForUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns success and executes full flow when stripe + payment data exist', async () => {
    const profileQ = makeProfilesQuery({
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
    });
    const businessQ = makeBusinessQuery({ id: 'biz_1' });
    const paymentLookupQ = makePaymentLookupQuery({
      id: 'pa_1',
      stripe_account_id: 'acct_1',
    });
    const paymentDeleteQ = makePaymentDeleteQuery(null);
    const { storageFrom } = makeStorageBucketMock();

    const from = vi
      .fn()
      .mockImplementationOnce(() => profileQ)
      .mockImplementationOnce(() => businessQ)
      .mockImplementationOnce(() => paymentLookupQ)
      .mockImplementationOnce(() => paymentDeleteQ);

    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from,
      storage: { from: storageFrom },
      auth: { admin: { deleteUser } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const cancel = vi.fn().mockResolvedValue({});
    const delCustomer = vi.fn().mockResolvedValue({});
    vi.mocked(getStripePlatform).mockReturnValue({
      subscriptions: { cancel },
      customers: { del: delCustomer },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await deleteAccountForUser({
      userId: 'user_1',
      userEmail: 'owner@example.com',
    });

    expect(result).toEqual({ ok: true, warnings: [] });
    expect(cancel).toHaveBeenCalledWith('sub_123');
    expect(delCustomer).toHaveBeenCalledWith('cus_123');
    expect(deleteUser).toHaveBeenCalledWith('user_1');
  });

  it('fails fast when subscription cancel returns non-missing error', async () => {
    const profileQ = makeProfilesQuery({
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
    });
    const businessQ = makeBusinessQuery({ id: 'biz_1' });
    const paymentLookupQ = makePaymentLookupQuery(null);
    const { storageFrom } = makeStorageBucketMock();

    const from = vi
      .fn()
      .mockImplementationOnce(() => profileQ)
      .mockImplementationOnce(() => businessQ)
      .mockImplementationOnce(() => paymentLookupQ);

    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from,
      storage: { from: storageFrom },
      auth: { admin: { deleteUser } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const cancel = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('card network error'), { code: 'api_error' })
      );
    const delCustomer = vi.fn().mockResolvedValue({});
    vi.mocked(getStripePlatform).mockReturnValue({
      subscriptions: { cancel },
      customers: { del: delCustomer },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await deleteAccountForUser({
      userId: 'user_2',
      userEmail: 'owner@example.com',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('STRIPE_ERROR');
    expect(delCustomer).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it('continues when subscription is already missing and customer delete soft-fails', async () => {
    const profileQ = makeProfilesQuery({
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_missing',
    });
    const businessQ = makeBusinessQuery(null);

    const { storageFrom } = makeStorageBucketMock();

    const from = vi
      .fn()
      .mockImplementationOnce(() => profileQ)
      .mockImplementationOnce(() => businessQ);

    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from,
      storage: { from: storageFrom },
      auth: { admin: { deleteUser } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const cancel = vi.fn().mockRejectedValue(
      Object.assign(new Error('No such subscription: sub_missing'), {
        code: 'resource_missing',
      })
    );
    const delCustomer = vi
      .fn()
      .mockRejectedValue(new Error('No such customer: cus_123'));

    vi.mocked(getStripePlatform).mockReturnValue({
      subscriptions: { cancel },
      customers: { del: delCustomer },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await deleteAccountForUser({
      userId: 'user_3',
      userEmail: 'owner@example.com',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'subscription_already_missing',
        'stripe_customer_delete_soft_failed',
      ])
    );
    expect(deleteUser).toHaveBeenCalledWith('user_3');
    expect(storageFrom).not.toHaveBeenCalled();
  });
});
