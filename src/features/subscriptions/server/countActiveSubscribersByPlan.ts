import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customerMembershipsOf } from './membershipTablesQuery';

/** Statuses that count toward plan card “active subscribers”. */
const ACTIVE_MEMBERSHIP_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
] as const;

/**
 * Batch active subscriber counts keyed by plan_id for an owner’s business.
 */
export async function countActiveSubscribersByPlan(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const bid = businessId.trim();
  if (!bid) return counts;

  const { data, error } = await customerMembershipsOf(supabase)
    .select('plan_id')
    .eq('business_id', bid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES])
    .not('plan_id', 'is', null);

  if (error || !data) return counts;

  for (const row of data) {
    const planId = (row.plan_id as string | null)?.trim();
    if (!planId) continue;
    counts.set(planId, (counts.get(planId) ?? 0) + 1);
  }
  return counts;
}
