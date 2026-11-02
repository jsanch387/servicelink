import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isBusinessInMembershipsRollout } from './isBusinessInMembershipsRollout';

type PlanIdRow = Pick<
  Database['public']['Tables']['membership_plans']['Row'],
  'id'
>;

/**
 * Cheap tab-visibility check: Pro + rollout + at least one published plan
 * with a price. Does not load plan bodies or price rows.
 */
export async function hasPublicMembershipPlans(
  admin: SupabaseClient<Database>,
  businessId: string,
  options: { ownerHasPro: boolean }
): Promise<boolean> {
  if (!options.ownerHasPro) return false;

  const id = businessId?.trim();
  if (!id) return false;

  const inRollout = await isBusinessInMembershipsRollout(admin, id);
  if (!inRollout) return false;

  try {
    const { data: planRows, error: plansError } = await admin
      .from('membership_plans')
      .select('id')
      .eq('business_id', id)
      .eq('is_published', true)
      .is('deleted_at', null);

    if (plansError) {
      console.error(
        '[memberships] hasPublicMembershipPlans plans',
        plansError.message
      );
      return false;
    }

    const planIds = ((planRows ?? []) as PlanIdRow[]).map(row => row.id);
    if (planIds.length === 0) return false;

    const { count, error: pricesError } = await admin
      .from('membership_plan_prices')
      .select('id', { count: 'exact', head: true })
      .in('plan_id', planIds);

    if (pricesError) {
      console.error(
        '[memberships] hasPublicMembershipPlans prices',
        pricesError.message
      );
      return false;
    }

    return (count ?? 0) > 0;
  } catch (err) {
    console.error('[memberships] hasPublicMembershipPlans failed', err);
    return false;
  }
}
