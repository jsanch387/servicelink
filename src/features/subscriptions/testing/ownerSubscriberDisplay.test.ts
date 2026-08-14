import { describe, expect, it } from 'vitest';
import {
  formatEndedSubscribersToggleLabel,
  formatSubscriberPlanLabel,
  isCurrentOwnerSubscriber,
  isOwnerSubscriberCountedAsActive,
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

describe('formatEndedSubscribersToggleLabel', () => {
  it('offers canceled history without changing the current count', () => {
    expect(
      formatEndedSubscribersToggleLabel({
        endedCount: 3,
        showingEnded: false,
        allCanceled: true,
      })
    ).toBe('Show canceled (3)');
    expect(
      formatEndedSubscribersToggleLabel({
        endedCount: 3,
        showingEnded: true,
        allCanceled: true,
      })
    ).toBe('Hide canceled');
  });
});
