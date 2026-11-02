import { describe, expect, it } from 'vitest';

import { parseTeamInviteName } from '../utils/parseTeamInviteName';

describe('parseTeamInviteName', () => {
  it('requires a name', () => {
    expect(parseTeamInviteName(undefined)).toEqual({
      ok: false,
      error: 'Enter their name.',
      status: 400,
    });
    expect(parseTeamInviteName(null)).toEqual({
      ok: false,
      error: 'Enter their name.',
      status: 400,
    });
  });

  it('trims a typed name', () => {
    expect(parseTeamInviteName('  Sam Rivera  ')).toEqual({
      ok: true,
      name: 'Sam Rivera',
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
