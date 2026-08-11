import { describe, expect, it } from 'vitest';
import {
  isMembershipsRolloutAllowlistActive,
  isOwnerEmailAllowedForMembershipsRollout,
  MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL,
  MEMBERSHIPS_ROLLOUT_OWNER_EMAILS,
} from '../config/membershipsRolloutAllowlist';

describe('membershipsRolloutAllowlist', () => {
  it('keeps open-to-all off during beta', () => {
    expect(MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL).toBe(false);
  });

  it('is active when the email list is non-empty', () => {
    expect(MEMBERSHIPS_ROLLOUT_OWNER_EMAILS.length).toBeGreaterThan(0);
    expect(isMembershipsRolloutAllowlistActive()).toBe(true);
  });

  it('allows listed owner emails (case-insensitive)', () => {
    const sample = MEMBERSHIPS_ROLLOUT_OWNER_EMAILS[0]!;
    expect(isOwnerEmailAllowedForMembershipsRollout(sample)).toBe(true);
    expect(isOwnerEmailAllowedForMembershipsRollout(sample.toUpperCase())).toBe(
      true
    );
  });

  it('denies owners not on the list', () => {
    expect(
      isOwnerEmailAllowedForMembershipsRollout('not-in-rollout@example.com')
    ).toBe(false);
    expect(isOwnerEmailAllowedForMembershipsRollout(null)).toBe(false);
  });
});
