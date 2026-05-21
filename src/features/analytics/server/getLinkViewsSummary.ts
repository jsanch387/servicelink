import {
  periodToSinceIso,
  type AnalyticsPeriod,
} from '@/features/analytics/constants';
import type { LinkViewsSummary } from '@/features/analytics/types/analytics';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getLinkViewsSummary(
  supabase: SupabaseClient,
  businessProfileId: string,
  period: AnalyticsPeriod
): Promise<LinkViewsSummary> {
  const since = periodToSinceIso(period);

  let countQuery = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('public_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_profile_id', businessProfileId)
      .eq('event_type', 'page_view');

  if (since) {
    countQuery = countQuery.gte('occurred_at', since);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw countError;
  }

  // Last visit is all-time (not period-scoped) so it stays accurate when the window has 0 views.
  const { data: lastRow, error: lastError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('public_analytics_events')
      .select('occurred_at')
      .eq('business_profile_id', businessProfileId)
      .eq('event_type', 'page_view')
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  if (lastError) {
    throw lastError;
  }

  const lastViewedAt =
    (lastRow as { occurred_at?: string } | null)?.occurred_at ?? null;

  return {
    businessProfileId,
    period,
    views: count ?? 0,
    lastViewedAt,
  };
}
