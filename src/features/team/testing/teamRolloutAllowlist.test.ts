import { describe, expect, it } from 'vitest';
import {
  isOwnerEmailAllowedForTeamRollout,
  isTeamRolloutAllowlistActive,
  TEAM_ROLLOUT_OPEN_TO_ALL,
} from '../config/teamRolloutAllowlist';

describe('teamRolloutAllowlist', () => {
  it('is limited to the listed owner while closed', () => {
    expect(TEAM_ROLLOUT_OPEN_TO_ALL).toBe(false);
    expect(isTeamRolloutAllowlistActive()).toBe(true);
    expect(isOwnerEmailAllowedForTeamRollout('jesuss387@gmail.com')).toBe(true);
    expect(isOwnerEmailAllowedForTeamRollout('  JesusS387@gmail.com  ')).toBe(
      true
    );
    expect(isOwnerEmailAllowedForTeamRollout('other@shop.com')).toBe(false);
    expect(isOwnerEmailAllowedForTeamRollout(null)).toBe(false);
  });
});
