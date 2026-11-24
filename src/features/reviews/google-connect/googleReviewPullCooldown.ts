/** Minimum gap between manual Google review refreshes for one business. */
export const GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS = 3 * 60 * 1000;

export const GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE =
  'Google was just refreshed. Try again in a few minutes.';

/** Seconds until another refresh is allowed. 0 means it can run now. */
export function googleReviewPullRetryAfterSec(
  lastSyncedAt: string | null,
  nowMs: number = Date.now()
): number {
  if (!lastSyncedAt) return 0;
  const syncedAt = Date.parse(lastSyncedAt);
  if (Number.isNaN(syncedAt)) return 0;
  const remainingMs =
    GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS - (nowMs - syncedAt);
  if (remainingMs <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMs / 1000));
}
