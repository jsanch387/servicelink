import { describe, expect, it } from 'vitest';

import { parseTeamInviteName } from '../utils/parseTeamInviteName';

describe('parseTeamInviteName', () => {
  it('allows omitting name', () => {
    expect(parseTeamInviteName(undefined)).toEqual({
      ok: true,
      name: null,
      provided: false,
    });
    expect(parseTeamInviteName(null)).toEqual({
      ok: true,
      name: null,
      provided: false,
    });
  });

  it('trims a typed name', () => {
    expect(parseTeamInviteName('  Sam Rivera  ')).toEqual({
      ok: true,
      name: 'Sam Rivera',
      provided: true,
    });
  });

  it('rejects blank or too-long names', () => {
    expect(parseTeamInviteName('   ')).toEqual({
      ok: false,
      error: 'Enter their name.',
      status: 400,
    });
    expect(parseTeamInviteName('a'.repeat(81))).toEqual({
      ok: false,
      error: 'Enter their name.',
      status: 400,
    });
  });
});
