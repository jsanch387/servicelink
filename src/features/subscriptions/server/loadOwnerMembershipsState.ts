import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { countActiveSubscribersByPlan } from './countActiveSubscribersByPlan';
import { mapMembershipPlanToOwner } from './mapMembershipPlanRow';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

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
  const { data: planRows, error: plansError } = await membershipPlansOf(
    supabase
  )
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

  const planIds = planRows.map((plan: { id: string }) => plan.id);
  const { data: priceRows, error: pricesError } = await membershipPlanPricesOf(
    supabase
  )
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

  const pricesByPlan = new Map<string, typeof priceRows>();
  for (const price of priceRows ?? []) {
    const planId = String(price.plan_id);
    const list = pricesByPlan.get(planId) ?? [];
    list.push(price);
    pricesByPlan.set(planId, list);
  }

  const activeByPlan = await countActiveSubscribersByPlan(supabase, businessId);

  return {
    ok: true,
    plans: planRows.map(
      (plan: Parameters<typeof mapMembershipPlanToOwner>[0]) =>
        mapMembershipPlanToOwner(
          plan,
          pricesByPlan.get(plan.id) ?? [],
          activeByPlan.get(plan.id) ?? 0
        )
    ),
  };
}
