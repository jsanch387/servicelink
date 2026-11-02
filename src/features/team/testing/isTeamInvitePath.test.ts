import { describe, expect, it } from 'vitest';

import { getTeamInvitePath, isTeamInvitePath } from '@/constants/routes';

describe('isTeamInvitePath', () => {
  it('accepts a team invite path', () => {
    expect(isTeamInvitePath(getTeamInvitePath('abc_DEF-123'))).toBe(true);
  });

  it('rejects other app paths', () => {
    expect(isTeamInvitePath('/dashboard')).toBe(false);
    expect(isTeamInvitePath('/team/invite')).toBe(false);
    expect(isTeamInvitePath('https://evil.example/team/invite/abc')).toBe(
      false
    );
  });
});
