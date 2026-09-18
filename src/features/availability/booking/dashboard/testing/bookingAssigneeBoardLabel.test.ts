import { describe, expect, it } from 'vitest';

import {
  bookingAssigneeBoardLabel,
  calendarAssigneeLabel,
} from '../utils/bookingAssigneeBoardLabel';
import { formatAssigneeBoardName } from '../utils/formatAssigneeBoardName';

const owner = {
  userId: 'owner-1',
  label: 'jesus@shop.com (owner)',
  kind: 'owner' as const,
};
const member = {
  userId: 'worker-1',
  label: 'jose.garcia@shop.com',
  kind: 'member' as const,
};

describe('formatAssigneeBoardName', () => {
  it('uses the email local part', () => {
    expect(formatAssigneeBoardName('jose.garcia@shop.com', 'member')).toBe(
      'Jose'
    );
    expect(formatAssigneeBoardName('jesus@shop.com (owner)', 'owner')).toBe(
      'Jesus'
    );
  });

  it('keeps fallback picker labels', () => {
    expect(formatAssigneeBoardName('Owner', 'owner')).toBe('Owner');
    expect(formatAssigneeBoardName('Team member', 'member')).toBe(
      'Team member'
    );
  });
});

describe('bookingAssigneeBoardLabel', () => {
  it('hides the line when the shop has no teammates', () => {
    expect(bookingAssigneeBoardLabel('owner-1', [owner])).toBeNull();
  });

  it('shows Unassigned or the short name', () => {
    const team = [owner, member];
    expect(bookingAssigneeBoardLabel(null, team)).toBe('Unassigned');
    expect(bookingAssigneeBoardLabel('worker-1', team)).toBe('Jose');
    expect(bookingAssigneeBoardLabel('gone', team)).toBe('Assigned');
  });

  it('still names a removed teammate on past jobs', () => {
    expect(
      bookingAssigneeBoardLabel('gone-1', [
        owner,
        { userId: 'gone-1', label: 'jose@shop.com', kind: 'former' },
      ])
    ).toBe('Jose');
  });
});

describe('calendarAssigneeLabel', () => {
  it('omits Unassigned so chips stay short', () => {
    expect(calendarAssigneeLabel('Jose')).toBe('Jose');
    expect(calendarAssigneeLabel('Unassigned')).toBeNull();
    expect(calendarAssigneeLabel(null)).toBeNull();
  });
});
