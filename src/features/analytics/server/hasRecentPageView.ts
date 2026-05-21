import { PAGE_VIEW_DEDUP_WINDOW_MS } from '@/features/analytics/constants';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * True if this visitor already has a page_view for this business inside the dedup window.
 */
export async function hasRecentPageView(
  admin: SupabaseClient,
  businessProfileId: string,
  visitorKey: string
): Promise<boolean> {
  const since = new Date(Date.now() - PAGE_VIEW_DEDUP_WINDOW_MS).toISOString();

  const { data, error } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('public_analytics_events')
      .select('id')
      .eq('business_profile_id', businessProfileId)
      .eq('visitor_key', visitorKey)
      .eq('event_type', 'page_view')
      .gte('occurred_at', since)
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error('[Analytics] Recent page_view lookup failed:', error);
    return false;
  }

  return data != null;
}
