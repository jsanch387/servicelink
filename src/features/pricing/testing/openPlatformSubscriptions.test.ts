import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import {
  cancelExtraPlatformProSubscriptions,
  decideProCheckoutAction,
  listOpenPlatformSubscriptions,
} from '../server/openPlatformSubscriptions';

describe('decideProCheckoutAction', () => {
  it('allows a new subscription when this customer has no open sub (canceled / first paid)', () => {
    expect(decideProCheckoutAction([])).toEqual({ action: 'new_subscription' });
  });

  it('resumes a single past_due sub instead of creating another', () => {
    expect(
      decideProCheckoutAction(
        [{ id: 'sub_old', status: 'past_due' }],
        'sub_old'
      )
    ).toEqual({
      action: 'resume',
      subscriptionId: 'sub_old',
      extraIds: [],
    });
  });

  it('resumes the customer past_due even when the profile sub id is missing', () => {
    expect(
      decideProCheckoutAction([{ id: 'sub_old', status: 'past_due' }], null)
    ).toEqual({
      action: 'resume',
      subscriptionId: 'sub_old',
      extraIds: [],
    });
  });

  it('blocks checkout when this customer already has an active sub', () => {
    expect(
      decideProCheckoutAction(
        [{ id: 'sub_live', status: 'active' }],
        'sub_live'
      )
    ).toEqual({
      action: 'block_healthy',
      keeperId: 'sub_live',
      extraIds: [],
    });
  });

  it('keeps the live sub and marks the leftover past_due as extra (do not invoice it)', () => {
    expect(
      decideProCheckoutAction(
        [
          { id: 'sub_old', status: 'past_due' },
          { id: 'sub_new', status: 'active' },
        ],
        'sub_old'
      )
    ).toEqual({
      action: 'block_healthy',
      keeperId: 'sub_new',
      extraIds: ['sub_old'],
    });
  });

  it('prefers the profile id when it is the healthy sub', () => {
    expect(
      decideProCheckoutAction(
        [
          { id: 'sub_new', status: 'active' },
          { id: 'sub_old', status: 'past_due' },
        ],
        'sub_new'
      )
    ).toEqual({
      action: 'block_healthy',
      keeperId: 'sub_new',
      extraIds: ['sub_old'],
    });
  });
});

describe('listOpenPlatformSubscriptions', () => {
  it('returns only this customer’s non-canceled subs', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn().mockResolvedValue({
          data: [
            { id: 'sub_open', status: 'past_due' },
            { id: 'sub_done', status: 'canceled' },
            { id: 'sub_live', status: 'active' },
          ],
        }),
      },
    } as unknown as Stripe;

    const result = await listOpenPlatformSubscriptions(mockStripe, 'cus_123');

    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_123',
      status: 'all',
      limit: 20,
    });
    expect(result.map(sub => sub.id)).toEqual(['sub_open', 'sub_live']);
  });

  it('throws when Stripe list fails so checkout does not create a second sub', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn().mockRejectedValue(new Error('Stripe down')),
      },
    } as unknown as Stripe;

    await expect(
      listOpenPlatformSubscriptions(mockStripe, 'cus_123')
    ).rejects.toThrow('Stripe down');
  });
});

describe('cancelExtraPlatformProSubscriptions', () => {
  it('voids open invoices then cancels the leftover sub', async () => {
    const voidInvoice = vi.fn().mockResolvedValue({});
    const cancel = vi.fn().mockResolvedValue({});
    const mockStripe = {
      invoices: {
        list: vi.fn().mockResolvedValue({
          data: [{ id: 'in_open', status: 'open' }],
        }),
        voidInvoice,
      },
      subscriptions: { cancel },
    } as unknown as Stripe;

    const canceled = await cancelExtraPlatformProSubscriptions(mockStripe, [
      'sub_old',
    ]);

    expect(voidInvoice).toHaveBeenCalledWith('in_open');
    expect(cancel).toHaveBeenCalledWith('sub_old');
    expect(canceled).toEqual(['sub_old']);
  });
});
