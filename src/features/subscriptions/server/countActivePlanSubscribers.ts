import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isMembershipCancelScheduled } from './mapCustomerMembershipToOwnerSubscriber';
import { customerMembershipsOf } from './membershipTablesQuery';

/**
 * Statuses that count as active for plan cards / delete / cadence removal.
 * Cancel-at-period-end (and future cancel_at) are excluded — treated as canceled.
 */
const ACTIVE_MEMBERSHIP_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
] as const;

type ActiveCountRow = {
  status?: string | null;
  cancel_at_period_end?: boolean | null;
  cancel_at?: string | null;
};

function isCountedAsActiveSubscriber(row: ActiveCountRow): boolean {
  return !isMembershipCancelScheduled(row);
}

/**
 * Active customer memberships on a plan (excludes cancel requested).
 */
export async function countActivePlanSubscribers(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string
): Promise<number> {
  const bid = businessId.trim();
  const pid = planId.trim();
  if (!bid || !pid) return 0;

  const { data, error } = await customerMembershipsOf(supabase)
    .select('status, cancel_at_period_end, cancel_at')
    .eq('business_id', bid)
    .eq('plan_id', pid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES]);

  if (error || !data) return 0;
  return data.filter(row => isCountedAsActiveSubscriber(row)).length;
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

  const { data, error } = await customerMembershipsOf(supabase)
    .select('status, cancel_at_period_end, cancel_at')
    .eq('business_id', bid)
    .eq('plan_price_id', pid)
    .in('status', [...ACTIVE_MEMBERSHIP_STATUSES]);

  if (error || !data) return 0;
  return data.filter(row => isCountedAsActiveSubscriber(row)).length;
}
