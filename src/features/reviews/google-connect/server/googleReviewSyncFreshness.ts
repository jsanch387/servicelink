/** Opening Reviews refreshes Google when the last pull is older than this. */
export const GOOGLE_REVIEW_SYNC_STALE_MS = 12 * 60 * 60 * 1000;

export function isGoogleReviewSyncStale(
  lastSyncedAt: string | null,
  nowMs: number = Date.now()
): boolean {
  if (!lastSyncedAt) return true;
  const syncedAt = Date.parse(lastSyncedAt);
  if (Number.isNaN(syncedAt)) return true;
  return nowMs - syncedAt >= GOOGLE_REVIEW_SYNC_STALE_MS;
}
