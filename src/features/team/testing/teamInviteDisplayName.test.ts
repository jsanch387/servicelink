import { describe, expect, it } from 'vitest';

import {
  teamInviteDisplayName,
  teamMemberHeading,
} from '../utils/teamInviteDisplayName';

const invites = [
  {
    email: 'jose@shop.com',
    name: 'Jose Garcia',
    accepted_user_id: 'user-1',
  },
  {
    email: 'sam@shop.com',
    name: 'Sam',
    accepted_user_id: null,
  },
];

describe('teamInviteDisplayName', () => {
  it('matches accepted user id first, then email', () => {
    expect(
      teamInviteDisplayName(invites, {
        userId: 'user-1',
        email: 'other@shop.com',
      })
    ).toBe('Jose Garcia');
    expect(teamInviteDisplayName(invites, { email: 'sam@shop.com' })).toBe(
      'Sam'
    );
  });

  it('returns null when no invite name exists', () => {
    expect(
      teamInviteDisplayName(invites, { email: 'missing@shop.com' })
    ).toBeNull();
  });
});

describe('teamMemberHeading', () => {
  it('prefers name, then email', () => {
    expect(teamMemberHeading({ name: 'Sam Rivera', email: 's@shop.com' })).toBe(
      'Sam Rivera'
    );
    expect(teamMemberHeading({ name: null, email: 's@shop.com' })).toBe(
      's@shop.com'
    );
  });
});
