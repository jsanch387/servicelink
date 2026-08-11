import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import { isBusinessInMembershipsRollout } from './isBusinessInMembershipsRollout';
import { mapMembershipPlanToCustomer } from './mapMembershipPlanRow';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];

/**
 * Published membership plans for the public booking link.
 * Requires owner Pro + rollout allowlist. Uses admin client (RLS is owner-only).
 */
export async function loadPublicMembershipPlans(
  admin: SupabaseClient<Database>,
  businessId: string,
  options: { ownerHasPro: boolean }
): Promise<CustomerSubscriptionPlan[]> {
  if (!options.ownerHasPro) return [];

  const id = businessId?.trim();
  if (!id) return [];

  const inRollout = await isBusinessInMembershipsRollout(admin, id);
  if (!inRollout) return [];

  try {
    const { data: planData, error: plansError } = await admin
      .from('membership_plans')
      .select('*')
      .eq('business_id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (plansError) {
      console.error(
        '[memberships] loadPublicMembershipPlans plans',
        plansError.message
      );
      return [];
    }

    const planRows = (planData ?? []) as PlanRow[];
    if (planRows.length === 0) return [];

    const planIds = planRows.map(plan => plan.id);
    const { data: priceData, error: pricesError } = await admin
      .from('membership_plan_prices')
      .select('*')
      .in('plan_id', planIds)
      .order('created_at', { ascending: true });

    if (pricesError) {
      console.error(
        '[memberships] loadPublicMembershipPlans prices',
        pricesError.message
      );
      return [];
    }

    const priceRows = (priceData ?? []) as PriceRow[];
    const pricesByPlan = new Map<string, PriceRow[]>();
    for (const price of priceRows) {
      const list = pricesByPlan.get(price.plan_id) ?? [];
      list.push(price);
      pricesByPlan.set(price.plan_id, list);
    }

    return planRows
      .map(plan =>
        mapMembershipPlanToCustomer(plan, pricesByPlan.get(plan.id) ?? [])
      )
      .filter(plan => plan.cadenceOptions.length > 0);
  } catch (err) {
    console.error('[memberships] loadPublicMembershipPlans failed', err);
    return [];
  }
}
