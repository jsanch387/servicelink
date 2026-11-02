import { describe, expect, it } from 'vitest';
import {
  isOwnerEmailAllowedForTeamRollout,
  isTeamRolloutAllowlistActive,
  TEAM_ROLLOUT_OPEN_TO_ALL,
} from '../config/teamRolloutAllowlist';

describe('teamRolloutAllowlist', () => {
  it('is open to every owner', () => {
    expect(TEAM_ROLLOUT_OPEN_TO_ALL).toBe(true);
    expect(isTeamRolloutAllowlistActive()).toBe(false);
    expect(isOwnerEmailAllowedForTeamRollout('other@shop.com')).toBe(true);
    expect(isOwnerEmailAllowedForTeamRollout('  Other@shop.com  ')).toBe(true);
    expect(isOwnerEmailAllowedForTeamRollout(null)).toBe(true);
  });
});
