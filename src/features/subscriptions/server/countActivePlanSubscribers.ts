import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customerMembershipsOf } from './membershipTablesQuery';

/** Statuses that block plan delete / cadence removal. */
const ACTIVE_MEMBERSHIP_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
] as const;

/**
 * Active customer memberships on a plan.
 */
export async function countActivePlanSubscribers(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string
): Promise<number> {
  const bid = businessId.trim();
  const pid = planId.trim();
  if (!bid || !pid) return 0;

  const { count, error } = await customerMembershipsOf(supabase)
    .select('id', { count: 'exact', head: true })
    .eq('business_id', bid)
    .eq('plan_id', pid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES]);

  if (error) return 0;
  return typeof count === 'number' && Number.isFinite(count) ? count : 0;
}

/**
 * Active customer memberships on a specific cadence / price row.
 */
export async function countActivePriceSubscribers(
  supabase: SupabaseClient<Database>,
  businessId: string,
  priceId: string
): Promise<number> {
  const bid = businessId.trim();
  const pid = priceId.trim();
  if (!bid || !pid) return 0;

  const { count, error } = await customerMembershipsOf(supabase)
    .select('id', { count: 'exact', head: true })
    .eq('business_id', bid)
    .eq('plan_price_id', pid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES]);

  if (error) return 0;
  return typeof count === 'number' && Number.isFinite(count) ? count : 0;
}
