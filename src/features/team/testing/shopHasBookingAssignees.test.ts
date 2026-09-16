import { describe, expect, it } from 'vitest';

import { shopHasBookingAssignees } from '../utils/shopHasBookingAssignees';

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
});
