import { describe, expect, it } from 'vitest';

import {
  createTeamInviteToken,
  hashTeamInviteToken,
} from '../utils/hashTeamInviteToken';

describe('hashTeamInviteToken', () => {
  it('hashes the raw token as sha256 hex', () => {
    expect(hashTeamInviteToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('creates a unique raw token and matching hash', () => {
    const first = createTeamInviteToken();
    const second = createTeamInviteToken();
    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).toBe(hashTeamInviteToken(first.rawToken));
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
