import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isMembershipCancelScheduled } from './mapCustomerMembershipToOwnerSubscriber';
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
 * Cancel-at-period-end / future cancel_at are excluded (same as list Active filter).
 */
export async function countActiveSubscribersByPlan(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const bid = businessId.trim();
  if (!bid) return counts;

  const { data, error } = await customerMembershipsOf(supabase)
    .select('plan_id, status, cancel_at_period_end, cancel_at')
    .eq('business_id', bid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES])
    .not('plan_id', 'is', null);

  if (error || !data) return counts;

  for (const row of data) {
    if (isMembershipCancelScheduled(row)) continue;
    const planId = (row.plan_id as string | null)?.trim();
    if (!planId) continue;
    counts.set(planId, (counts.get(planId) ?? 0) + 1);
  }
  return counts;
}
