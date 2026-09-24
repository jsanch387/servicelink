import { describe, expect, it } from 'vitest';
import {
  billingActionFromOpenSubscriptions,
  billingActionFromProfileStatus,
} from '../server/platformBillingAction';

describe('billingActionFromOpenSubscriptions', () => {
  it('starts checkout when nothing is open', () => {
    expect(billingActionFromOpenSubscriptions([])).toBe('checkout');
  });

  it('manages an active subscription instead of starting checkout', () => {
    expect(
      billingActionFromOpenSubscriptions(
        [{ id: 'sub_live', status: 'active' }],
        'sub_live'
      )
    ).toBe('manage');
  });

  it('asks for a payment update when the open subscription is past_due', () => {
    expect(
      billingActionFromOpenSubscriptions(
        [{ id: 'sub_old', status: 'past_due' }],
        'sub_old'
      )
    ).toBe('update_payment');
  });

  it('manages when a healthy subscription exists beside a past_due one', () => {
    expect(
      billingActionFromOpenSubscriptions(
        [
          { id: 'sub_old', status: 'past_due' },
          { id: 'sub_new', status: 'active' },
        ],
        'sub_old'
      )
    ).toBe('manage');
  });
});

describe('billingActionFromProfileStatus', () => {
  it('falls back to checkout when status is empty or canceled', () => {
    expect(billingActionFromProfileStatus(null)).toBe('checkout');
    expect(billingActionFromProfileStatus('canceled')).toBe('checkout');
  });

  it('falls back to manage for active and trialing', () => {
    expect(billingActionFromProfileStatus('active')).toBe('manage');
    expect(billingActionFromProfileStatus('trialing')).toBe('manage');
  });

  it('falls back to update payment for failed or incomplete charges', () => {
    expect(billingActionFromProfileStatus('past_due')).toBe('update_payment');
    expect(billingActionFromProfileStatus('unpaid')).toBe('update_payment');
    expect(billingActionFromProfileStatus('incomplete')).toBe('update_payment');
  });
});
