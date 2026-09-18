import { describe, expect, it } from 'vitest';

import {
  shopHasBookingAssignees,
  shopShowsAssigneeLabels,
} from '../utils/shopHasBookingAssignees';

describe('shopHasBookingAssignees', () => {
  it('is false when only the owner exists', () => {
    expect(
      shopHasBookingAssignees([
        { userId: 'owner-1', label: 'owner@shop.com (owner)', kind: 'owner' },
      ])
    ).toBe(false);
  });

  it('is true when an active teammate exists', () => {
    expect(
      shopHasBookingAssignees([
        { userId: 'owner-1', label: 'owner@shop.com (owner)', kind: 'owner' },
        { userId: 'm1', label: 'alex@shop.com', kind: 'member' },
      ])
    ).toBe(true);
  });

  it('still shows names after the last hire is removed', () => {
    const former = [
      {
        userId: 'owner-1',
        label: 'owner@shop.com (owner)',
        kind: 'owner' as const,
      },
      { userId: 'gone', label: 'jose@shop.com', kind: 'former' as const },
    ];
    expect(shopHasBookingAssignees(former)).toBe(false);
    expect(shopShowsAssigneeLabels(former)).toBe(true);
  });
});
