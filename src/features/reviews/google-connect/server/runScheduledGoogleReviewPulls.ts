import type { SupabaseClient } from '@supabase/supabase-js';
import { pullGoogleBusinessReviews } from './pullGoogleBusinessReviews';

/** One daily run. Sequential so we stay well under Google's per-minute quota. */
export const GOOGLE_REVIEW_PULL_BATCH = 40;

export type ScheduledGoogleReviewPullsResult = {
  found: number;
  pulled: number;
  imported: number;
  failed: number;
};

/**
 * Refresh stored Google reviews for connected businesses.
 * Oldest sync first, including rows that have never synced.
 */
export async function runScheduledGoogleReviewPulls(
  admin: SupabaseClient,
  options?: {
    limit?: number;
    pull?: (
      businessId: string
    ) => Promise<{ ok: boolean; importedCount?: number }>;
  }
): Promise<ScheduledGoogleReviewPullsResult> {
  const limit = options?.limit ?? GOOGLE_REVIEW_PULL_BATCH;
  const pull = options?.pull ?? pullGoogleBusinessReviews;

  const { data, error } = await admin
    .from('google_business_connections')
    .select('business_id')
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    throw new Error('Could not list Google connections for review pull.');
  }

  const businessIds = ((data ?? []) as { business_id?: string }[])
    .map(row => row.business_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const result: ScheduledGoogleReviewPullsResult = {
    found: businessIds.length,
    pulled: 0,
    imported: 0,
    failed: 0,
  };

  for (const businessId of businessIds) {
    try {
      const pulled = await pull(businessId);
      if (!pulled.ok) {
        result.failed += 1;
        continue;
      }
      result.pulled += 1;
      result.imported += pulled.importedCount ?? 0;
    } catch (pullError) {
      result.failed += 1;
      console.error('[reviews:google-connect] scheduled pull failed', {
        businessId,
        pullError,
      });
    }
  }

  return result;
}
