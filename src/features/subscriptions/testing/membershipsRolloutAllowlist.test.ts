import { describe, expect, it } from 'vitest';
import {
  isMembershipsRolloutAllowlistActive,
  isOwnerEmailAllowedForMembershipsRollout,
  MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL,
} from '../config/membershipsRolloutAllowlist';

describe('membershipsRolloutAllowlist', () => {
  it('is open to all eligible owners', () => {
    expect(MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL).toBe(true);
    expect(isMembershipsRolloutAllowlistActive()).toBe(false);
  });

  it('allows any owner email while open to all', () => {
    expect(
      isOwnerEmailAllowedForMembershipsRollout('any-owner@example.com')
    ).toBe(true);
    expect(isOwnerEmailAllowedForMembershipsRollout(null)).toBe(true);
  });
});
