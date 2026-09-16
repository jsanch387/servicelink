import { describe, expect, it } from 'vitest';

import { formatBookingAssigneeLabel } from '../utils/formatBookingAssigneeLabel';

describe('formatBookingAssigneeLabel', () => {
  it('labels the owner with their email', () => {
    expect(formatBookingAssigneeLabel('owner@shop.com', 'owner')).toBe(
      'owner@shop.com (owner)'
    );
  });

  it('falls back to Owner when the owner has no email', () => {
    expect(formatBookingAssigneeLabel('', 'owner')).toBe('Owner');
    expect(formatBookingAssigneeLabel(null, 'owner')).toBe('Owner');
  });

  it('uses the teammate email, or Team member', () => {
    expect(formatBookingAssigneeLabel('alex@shop.com', 'member')).toBe(
      'alex@shop.com'
    );
    expect(formatBookingAssigneeLabel('  ', 'member')).toBe('Team member');
  });
});
