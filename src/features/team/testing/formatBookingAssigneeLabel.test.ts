import { describe, expect, it } from 'vitest';

import { formatBookingAssigneeLabel } from '../utils/formatBookingAssigneeLabel';

describe('formatBookingAssigneeLabel', () => {
  it('labels the owner with their email', () => {
    expect(
      formatBookingAssigneeLabel({
        email: 'owner@shop.com',
        kind: 'owner',
      })
    ).toBe('owner@shop.com (owner)');
  });

  it('falls back to Owner when the owner has no email', () => {
    expect(formatBookingAssigneeLabel({ email: '', kind: 'owner' })).toBe(
      'Owner'
    );
    expect(formatBookingAssigneeLabel({ email: null, kind: 'owner' })).toBe(
      'Owner'
    );
  });

  it('prefers the teammate name over email', () => {
    expect(
      formatBookingAssigneeLabel({
        name: 'Alex Rivera',
        email: 'alex@shop.com',
        kind: 'member',
      })
    ).toBe('Alex Rivera');
    expect(
      formatBookingAssigneeLabel({ email: 'alex@shop.com', kind: 'member' })
    ).toBe('alex@shop.com');
    expect(formatBookingAssigneeLabel({ email: '  ', kind: 'member' })).toBe(
      'Team member'
    );
  });

  it('keeps a former teammate name for history', () => {
    expect(
      formatBookingAssigneeLabel({
        name: 'Jose',
        email: 'jose@shop.com',
        kind: 'former',
      })
    ).toBe('Jose');
    expect(
      formatBookingAssigneeLabel({ email: 'jose@shop.com', kind: 'former' })
    ).toBe('jose@shop.com');
    expect(formatBookingAssigneeLabel({ email: '', kind: 'former' })).toBe(
      'Former teammate'
    );
  });
});
