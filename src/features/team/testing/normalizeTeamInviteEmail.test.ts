import { describe, expect, it } from 'vitest';

import { normalizeTeamInviteEmail } from '../utils/normalizeTeamInviteEmail';

describe('normalizeTeamInviteEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeTeamInviteEmail('  Alex@Shop.COM ')).toBe('alex@shop.com');
  });
});
