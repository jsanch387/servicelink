import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { mapMembershipPlanToOwner } from './mapMembershipPlanRow';

export type OwnerMembershipsState = {
  plans: OwnerSubscriptionPlan[];
};

export type LoadOwnerMembershipsResult =
  | { ok: true; plans: OwnerSubscriptionPlan[] }
  | { ok: false; error: string };

export async function loadOwnerMembershipsState(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<LoadOwnerMembershipsResult> {
  const { data: planRows, error: plansError } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (plansError) {
    console.error(
      '[loadOwnerMembershipsState] membership_plans',
      plansError.message
    );
    return { ok: false, error: 'Failed to load subscription plans.' };
  }

  if (!planRows?.length) {
    return { ok: true, plans: [] };
  }

  const planIds = planRows.map(plan => plan.id);
  const { data: priceRows, error: pricesError } = await supabase
    .from('membership_plan_prices')
    .select('*')
    .in('plan_id', planIds)
    .order('created_at', { ascending: true });

  if (pricesError) {
    console.error(
      '[loadOwnerMembershipsState] membership_plan_prices',
      pricesError.message
    );
    return { ok: false, error: 'Failed to load plan pricing.' };
  }

  const pricesByPlan = new Map<string, NonNullable<typeof priceRows>>();
  for (const price of priceRows ?? []) {
    const list = pricesByPlan.get(price.plan_id) ?? [];
    list.push(price);
    pricesByPlan.set(price.plan_id, list);
  }

  return {
    ok: true,
    plans: planRows.map(plan =>
      mapMembershipPlanToOwner(plan, pricesByPlan.get(plan.id) ?? [])
    ),
  };
}
