/**
 * Tests for checkActiveSubscriptions helper function.
 * This function is critical for preventing duplicate subscription creation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  checkActiveSubscriptions,
  hasMultipleActiveSubscriptions,
} from '../server/checkActiveSubscriptions';
import type Stripe from 'stripe';

describe('checkActiveSubscriptions', () => {
  it('returns no active subscriptions when customer has none', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, 'cus_123');

    expect(result.hasActive).toBe(false);
    expect(result.activeSubscriptions).toEqual([]);
    expect(result.summary.activeCount).toBe(0);
    expect(result.summary.trialingCount).toBe(0);
  });

  it('returns active subscriptions when customer has one active', async () => {
    const mockSub = {
      id: 'sub_active',
      status: 'active',
    } as Stripe.Subscription;
    const mockStripe = {
      subscriptions: {
        list: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockSub] }) // active
          .mockResolvedValueOnce({ data: [] }), // trialing
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, 'cus_123');

    expect(result.hasActive).toBe(true);
    expect(result.activeSubscriptions).toHaveLength(1);
    expect(result.activeSubscriptions[0].id).toBe('sub_active');
    expect(result.summary.activeCount).toBe(1);
  });

  it('returns trialing subscriptions when customer has one trialing', async () => {
    const mockSub = {
      id: 'sub_trial',
      status: 'trialing',
    } as Stripe.Subscription;
    const mockStripe = {
      subscriptions: {
        list: vi
          .fn()
          .mockResolvedValueOnce({ data: [] }) // active
          .mockResolvedValueOnce({ data: [mockSub] }), // trialing
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, 'cus_123');

    expect(result.hasActive).toBe(true);
    expect(result.activeSubscriptions).toHaveLength(1);
    expect(result.activeSubscriptions[0].id).toBe('sub_trial');
    expect(result.summary.trialingCount).toBe(1);
  });

  it('detects multiple active subscriptions (duplicate scenario)', async () => {
    const mockSub1 = { id: 'sub_old', status: 'active' } as Stripe.Subscription;
    const mockSub2 = { id: 'sub_new', status: 'active' } as Stripe.Subscription;
    const mockStripe = {
      subscriptions: {
        list: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockSub1, mockSub2] }) // active
          .mockResolvedValueOnce({ data: [] }), // trialing
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, 'cus_123');

    expect(result.hasActive).toBe(true);
    expect(result.activeSubscriptions).toHaveLength(2);
    expect(result.summary.subscriptionIds).toEqual(['sub_old', 'sub_new']);
  });

  it('handles Stripe API errors gracefully', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn().mockRejectedValue(new Error('Stripe API error')),
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, 'cus_123');

    // Should return safe default (no active) to not block legitimate users
    expect(result.hasActive).toBe(false);
    expect(result.activeSubscriptions).toEqual([]);
  });

  it('handles empty customer ID', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn(),
      },
    } as unknown as Stripe;

    const result = await checkActiveSubscriptions(mockStripe, '');

    expect(result.hasActive).toBe(false);
    expect(mockStripe.subscriptions.list).not.toHaveBeenCalled();
  });
});

describe('hasMultipleActiveSubscriptions', () => {
  it('returns false when customer has 0 subscriptions', async () => {
    const mockStripe = {
      subscriptions: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    } as unknown as Stripe;

    const result = await hasMultipleActiveSubscriptions(mockStripe, 'cus_123');
    expect(result).toBe(false);
  });

  it('returns false when customer has 1 subscription', async () => {
    const mockSub = { id: 'sub_1', status: 'active' } as Stripe.Subscription;
    const mockStripe = {
      subscriptions: {
        list: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockSub] })
          .mockResolvedValueOnce({ data: [] }),
      },
    } as unknown as Stripe;

    const result = await hasMultipleActiveSubscriptions(mockStripe, 'cus_123');
    expect(result).toBe(false);
  });

  it('returns true when customer has 2+ subscriptions (ALERT)', async () => {
    const mockSub1 = { id: 'sub_1', status: 'active' } as Stripe.Subscription;
    const mockSub2 = { id: 'sub_2', status: 'active' } as Stripe.Subscription;
    const mockStripe = {
      subscriptions: {
        list: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockSub1, mockSub2] })
          .mockResolvedValueOnce({ data: [] }),
      },
    } as unknown as Stripe;

    const result = await hasMultipleActiveSubscriptions(mockStripe, 'cus_123');
    expect(result).toBe(true);
  });
});
