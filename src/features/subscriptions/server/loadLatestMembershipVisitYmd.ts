/**
 * Latest scheduled_date among membership-linked bookings (initial + period visit).
 * Canceled bookings do not count — the member still needs a visit this period.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseYmd } from '../utils/membershipPeriodVisitDateBounds';

function isCanceledBookingStatus(status: string | null | undefined): boolean {
  const value = (status ?? '').trim().toLowerCase();
  return value === 'cancelled' || value === 'canceled';
}

export async function loadLatestMembershipVisitYmd(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    bookingIds: Array<string | null | undefined>;
  }
): Promise<string | null> {
  const ids = [
    ...new Set(
      args.bookingIds
        .map(id => id?.trim())
        .filter((id): id is string => Boolean(id))
    ),
  ];
  if (ids.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('bookings')
    .select('scheduled_date, status')
    .eq('business_id', args.businessId)
    .in('id', ids);

  let latest: string | null = null;
  for (const row of (data ?? []) as Array<{
    scheduled_date?: string | null;
    status?: string | null;
  }>) {
    if (isCanceledBookingStatus(row.status)) continue;
    const ymd = parseYmd(row.scheduled_date?.trim().slice(0, 10) ?? '');
    if (!ymd) continue;
    if (!latest || ymd > latest) latest = ymd;
  }
  return latest;
}
