import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { countActivePlanSubscribers } from './countActivePlanSubscribers';
import { mapMembershipPlanToOwner } from './mapMembershipPlanRow';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

export async function getMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string
): Promise<OwnerSubscriptionPlan | null> {
  const { data: planRow, error } = await membershipPlansOf(supabase)
    .select('*')
    .eq('id', planId)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !planRow) return null;

  const { data: priceRows } = await membershipPlanPricesOf(supabase)
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });

  const activeSubscriberCount = await countActivePlanSubscribers(
    supabase,
    businessId,
    planId
  );

  return mapMembershipPlanToOwner(
    planRow,
    priceRows ?? [],
    activeSubscriberCount
  );
}
