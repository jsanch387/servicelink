import { describe, expect, it } from 'vitest';
import {
  GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS,
  googleReviewPullRetryAfterSec,
} from '../googleReviewPullCooldown';

describe('googleReviewPullRetryAfterSec', () => {
  const now = Date.parse('2026-11-02T12:00:00.000Z');

  it('allows a refresh when Google has never been pulled', () => {
    expect(googleReviewPullRetryAfterSec(null, now)).toBe(0);
  });

  it('blocks a refresh inside the cooldown', () => {
    const syncedAt = new Date(now - 30 * 1000).toISOString();
    const retryAfter = googleReviewPullRetryAfterSec(syncedAt, now);
    expect(retryAfter).toBeGreaterThan(60);
    expect(retryAfter).toBeLessThanOrEqual(
      GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS / 1000
    );
  });

  it('allows a refresh after the cooldown', () => {
    const syncedAt = new Date(
      now - GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS - 1000
    ).toISOString();
    expect(googleReviewPullRetryAfterSec(syncedAt, now)).toBe(0);
  });
});
