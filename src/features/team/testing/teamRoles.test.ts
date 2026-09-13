import { describe, expect, it } from 'vitest';

import {
  isActiveTeamMemberStatus,
  isTeamMemberRole,
} from '../constants/teamRoles';

describe('teamRoles', () => {
  it('accepts member and rejects owner (owner is not in this table)', () => {
    expect(isTeamMemberRole('member')).toBe(true);
    expect(isTeamMemberRole('owner')).toBe(false);
    expect(isTeamMemberRole('admin')).toBe(false);
  });

  it('treats only active as an access-granting status', () => {
    expect(isActiveTeamMemberStatus('active')).toBe(true);
    expect(isActiveTeamMemberStatus('removed')).toBe(false);
    expect(isActiveTeamMemberStatus(null)).toBe(false);
  });
});
