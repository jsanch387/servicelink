import { describe, expect, it } from 'vitest';
import {
  BOOKING_LINK_V2_ROLLOUT_OPEN_TO_ALL,
  BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS,
  isBookingLinkV2RolloutAllowlistActive,
  isOwnerEmailAllowedForBookingLinkV2Rollout,
} from '../config/bookingLinkV2RolloutAllowlist';

describe('bookingLinkV2RolloutAllowlist', () => {
  it('keeps open-to-all off during beta', () => {
    expect(BOOKING_LINK_V2_ROLLOUT_OPEN_TO_ALL).toBe(false);
  });

  it('is active when the email list is non-empty', () => {
    expect(BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS.length).toBeGreaterThan(0);
    expect(isBookingLinkV2RolloutAllowlistActive()).toBe(true);
  });

  it('allows listed owner emails (case-insensitive)', () => {
    const sample = BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS[0]!;
    expect(isOwnerEmailAllowedForBookingLinkV2Rollout(sample)).toBe(true);
    expect(
      isOwnerEmailAllowedForBookingLinkV2Rollout(sample.toUpperCase())
    ).toBe(true);
  });

  it('denies owners not on the list', () => {
    expect(
      isOwnerEmailAllowedForBookingLinkV2Rollout('not-in-rollout@example.com')
    ).toBe(false);
    expect(isOwnerEmailAllowedForBookingLinkV2Rollout(null)).toBe(false);
  });
});
