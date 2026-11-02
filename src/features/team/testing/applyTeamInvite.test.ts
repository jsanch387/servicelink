import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyTeamInvite, applyTeamRemove } from '../utils/applyTeamInvite';
import type { TeamMemberUi } from '../types/teamMemberUi';

const existing: TeamMemberUi = {
  id: 'mock-1',
  email: 'jordan@example.com',
  name: 'Jordan',
  status: 'active',
  source: 'member',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyTeamInvite', () => {
  it('adds a normalized invited member', () => {
    vi.stubGlobal('crypto', {
      ...crypto,
      randomUUID: () => 'new-id',
    });

    const result = applyTeamInvite([existing], '  Alex@Shop.com  ');

    expect(result).toEqual({
      ok: true,
      member: {
        id: 'new-id',
        email: 'alex@shop.com',
        name: null,
        status: 'invited',
        source: 'invite',
      },
    });
  });

  it('rejects a blank email', () => {
    expect(applyTeamInvite([], '   ')).toEqual({
      ok: false,
      error: 'Email is required',
    });
  });

  it('rejects a duplicate email', () => {
    expect(applyTeamInvite([existing], 'Jordan@example.com')).toEqual({
      ok: false,
      error: 'Already on the team',
    });
  });
});

describe('applyTeamRemove', () => {
  it('removes the matching id', () => {
    expect(applyTeamRemove([existing], 'mock-1')).toEqual([]);
  });
});
