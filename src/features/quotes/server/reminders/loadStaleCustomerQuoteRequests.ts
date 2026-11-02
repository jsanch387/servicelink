import type { SupabaseClient } from '@supabase/supabase-js';
import { quoteRequestFollowUpBounds } from './quoteRequestFollowUpDate';

const PAGE_SIZE = 200;

export type StaleQuoteRequestRow = {
  id: string;
  business_id: string;
  requestedAt: string;
};

export type StaleQuoteRequestOwner = {
  profileId: string;
  count: number;
};

type QuotePageRow = {
  id?: string | null;
  business_id?: string | null;
  requested_at?: string | null;
  created_at?: string | null;
};

/**
 * Open customer requests in the follow-up window (stale, but not past the cap).
 * `null` means the query failed.
 */
export async function loadStaleCustomerQuoteRequests(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<StaleQuoteRequestRow[] | null> {
  const { staleBeforeIso, staleOnOrAfterIso } = quoteRequestFollowUpBounds(now);
  const rows: StaleQuoteRequestRow[] = [];
  let offset = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  while (true) {
    const { data, error } = await db
      .from('quotes')
      .select('id, business_id, requested_at, created_at')
      .eq('source', 'customer_requested')
      .eq('status', 'requested')
      .lt('requested_at', staleBeforeIso)
      .gte('requested_at', staleOnOrAfterIso)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.warn('[quote-request-follow-up] quotes page failed', {
        offset,
        message: error.message,
      });
      return null;
    }

    const page = (data ?? []) as QuotePageRow[];
    for (const row of page) {
      const id = row.id?.trim();
      const businessId = row.business_id?.trim();
      const requestedAt = (row.requested_at ?? row.created_at ?? '').trim();
      if (!id || !businessId || !requestedAt) continue;
      if (requestedAt >= staleBeforeIso) continue;
      if (requestedAt < staleOnOrAfterIso) continue;
      rows.push({ id, business_id: businessId, requestedAt });
    }
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

export async function loadQuoteRequestFollowUpOwners(
  supabase: SupabaseClient,
  businessIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(businessIds.map(id => id.trim()).filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, profile_id')
    .in('id', unique);

  if (error) {
    console.warn('[quote-request-follow-up] businesses query failed', {
      message: error.message,
    });
    return map;
  }

  for (const row of data ?? []) {
    const id = (row as { id?: string | null }).id?.trim();
    const profileId = (
      row as { profile_id?: string | null }
    ).profile_id?.trim();
    if (!id || !profileId) continue;
    map.set(id, profileId);
  }
  return map;
}

export function groupStaleRequestsByOwner(
  rows: StaleQuoteRequestRow[],
  businessToProfile: Map<string, string>
): StaleQuoteRequestOwner[] {
  const byOwner = new Map<string, number>();
  for (const row of rows) {
    const profileId = businessToProfile.get(row.business_id);
    if (!profileId) continue;
    byOwner.set(profileId, (byOwner.get(profileId) ?? 0) + 1);
  }
  return [...byOwner.entries()].map(([profileId, count]) => ({
    profileId,
    count,
  }));
}
