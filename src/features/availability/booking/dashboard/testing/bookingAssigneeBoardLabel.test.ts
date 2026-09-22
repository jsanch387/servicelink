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

  it('keeps the invite name on cards', () => {
    expect(formatAssigneeBoardName('Alex Rivera', 'member')).toBe(
      'Alex Rivera'
    );
  });
});

describe('bookingAssigneeBoardLabel', () => {
  it('hides the line when the shop has no teammates', () => {
    expect(bookingAssigneeBoardLabel('owner-1', [owner])).toBeNull();
  });

  it('hides the label until someone is assigned', () => {
    const team = [
      owner,
      { userId: 'worker-1', label: 'Alex Rivera', kind: 'member' as const },
    ];
    expect(bookingAssigneeBoardLabel(null, team)).toBeNull();
    expect(bookingAssigneeBoardLabel('worker-1', team)).toBe('Alex Rivera');
    expect(bookingAssigneeBoardLabel('gone', team)).toBe('Assigned');
  });

  it('falls back to the email local part when the invite has no name', () => {
    expect(bookingAssigneeBoardLabel('worker-1', [owner, member])).toBe('Jose');
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
