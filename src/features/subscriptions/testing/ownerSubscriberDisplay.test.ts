import { describe, expect, it } from 'vitest';
import {
  formatOwnerSubscriberEndedFilterLabel,
  formatSubscriberBillingDate,
  formatSubscriberBillingDateValue,
  formatSubscriberPlanLabel,
  getSubscriberStatusLabel,
  isCurrentOwnerSubscriber,
  isOwnerSubscriberCanceledForFilterLabel,
  isOwnerSubscriberCountedAsActive,
  isOwnerSubscriberInActiveList,
  isOwnerSubscriberInCanceledList,
} from '../utils/ownerSubscriberDisplay';

describe('isOwnerSubscriberCountedAsActive', () => {
  it('matches plan-card active counts', () => {
    expect(isOwnerSubscriberCountedAsActive('active')).toBe(true);
    expect(isOwnerSubscriberCountedAsActive('trialing')).toBe(true);
    expect(isOwnerSubscriberCountedAsActive('past_due')).toBe(true);
    expect(isOwnerSubscriberCountedAsActive('unpaid')).toBe(true);
    expect(isOwnerSubscriberCountedAsActive('paused')).toBe(true);
    expect(isOwnerSubscriberCountedAsActive('canceled')).toBe(false);
    expect(isOwnerSubscriberCountedAsActive('incomplete')).toBe(false);
  });
});

describe('formatSubscriberPlanLabel', () => {
  it('keeps the live plan name', () => {
    expect(formatSubscriberPlanLabel('Super Maintenance')).toBe(
      'Super Maintenance'
    );
  });

  it('marks a soft-deleted plan', () => {
    expect(formatSubscriberPlanLabel('Super Maintenance', true)).toBe(
      'Super Maintenance (removed)'
    );
  });

  it('does not invent a name when the plan row is gone', () => {
    expect(formatSubscriberPlanLabel('Plan', true)).toBe('Removed plan');
  });
});

describe('isCurrentOwnerSubscriber', () => {
  it('excludes members whose plan was removed', () => {
    expect(
      isCurrentOwnerSubscriber({ status: 'active', planRemoved: true })
    ).toBe(false);
    expect(
      isCurrentOwnerSubscriber({ status: 'active', planRemoved: false })
    ).toBe(true);
  });
});

describe('subscriber list filters', () => {
  it('puts cancel-at-period-end under Canceled, not Active', () => {
    const canceling = {
      status: 'active' as const,
      cancelAtPeriodEnd: true,
      planRemoved: false,
    };
    expect(isOwnerSubscriberInActiveList(canceling)).toBe(false);
    expect(isOwnerSubscriberInCanceledList(canceling)).toBe(true);
    expect(isOwnerSubscriberCanceledForFilterLabel(canceling)).toBe(true);
    // Plan delete / active counts still treat them as current.
    expect(isCurrentOwnerSubscriber(canceling)).toBe(true);
  });

  it('keeps fully canceled under Canceled', () => {
    const canceled = {
      status: 'canceled' as const,
      cancelAtPeriodEnd: false,
      planRemoved: false,
    };
    expect(isOwnerSubscriberInActiveList(canceled)).toBe(false);
    expect(isOwnerSubscriberInCanceledList(canceled)).toBe(true);
  });
});

describe('formatSubscriberBillingDateValue', () => {
  it('hides the date when they already canceled', () => {
    expect(
      formatSubscriberBillingDateValue({
        status: 'canceled',
        nextBillingAt: '2026-09-14',
      })
    ).toBe('—');
  });

  it('hides the date when cancel is scheduled', () => {
    expect(
      formatSubscriberBillingDateValue({
        status: 'active',
        cancelAtPeriodEnd: true,
        nextBillingAt: '2026-09-14',
      })
    ).toBe('—');
  });

  it('shows the date for a live member', () => {
    expect(
      formatSubscriberBillingDateValue({
        status: 'active',
        cancelAtPeriodEnd: false,
        nextBillingAt: '2026-09-14',
      })
    ).toBe(formatSubscriberBillingDate('2026-09-14'));
  });
});

describe('getSubscriberStatusLabel', () => {
  it('labels both cancel types as Canceled', () => {
    expect(getSubscriberStatusLabel('active', true)).toBe('Canceled');
    expect(getSubscriberStatusLabel('canceled', false)).toBe('Canceled');
    expect(getSubscriberStatusLabel('active', false)).toBe('Active');
  });
});

describe('formatOwnerSubscriberEndedFilterLabel', () => {
  it('uses canceled when every ended row is canceled', () => {
    expect(formatOwnerSubscriberEndedFilterLabel(true)).toBe('Canceled');
  });

  it('uses ended when history mixes canceled and other ended states', () => {
    expect(formatOwnerSubscriberEndedFilterLabel(false)).toBe('Ended');
  });
});
