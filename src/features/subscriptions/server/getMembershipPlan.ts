import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { mapMembershipPlanToOwner } from './mapMembershipPlanRow';

export async function getMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string
): Promise<OwnerSubscriptionPlan | null> {
  const { data: planRow, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', planId)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !planRow) return null;

  const { data: priceRows } = await supabase
    .from('membership_plan_prices')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });

  return mapMembershipPlanToOwner(planRow, priceRows ?? []);
}
