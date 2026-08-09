import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionCadenceOption } from '../types/customerSubscriptionPlan';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import {
  mapMembershipPlanToOwner,
  splitDescriptionAndBenefits,
} from './mapMembershipPlanRow';

export type CreateMembershipPlanInput = {
  name: string;
  description: string;
  cadenceOptions: Array<
    Pick<
      SubscriptionCadenceOption,
      'intervalUnit' | 'intervalCount' | 'priceCents'
    >
  >;
  isPublished?: boolean;
};

export async function createMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  input: CreateMembershipPlanInput
): Promise<
  { ok: true; plan: OwnerSubscriptionPlan } | { ok: false; error: string }
> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: 'Plan name is required.' };
  }
  if (!input.cadenceOptions.length) {
    return { ok: false, error: 'Add at least one pricing option.' };
  }

  const { description, benefits } = splitDescriptionAndBenefits(
    input.description
  );

  const { data: planRow, error: planError } = await supabase
    .from('membership_plans')
    .insert({
      business_id: businessId,
      name,
      description,
      benefits,
      is_published: input.isPublished !== false,
      is_popular: false,
      sort_order: 0,
    })
    .select('*')
    .single();

  if (planError || !planRow) {
    return {
      ok: false,
      error: planError?.message ?? 'Could not create plan.',
    };
  }

  const priceInserts = input.cadenceOptions.map((option, index) => ({
    plan_id: planRow.id,
    business_id: businessId,
    interval_unit: option.intervalUnit,
    interval_count: option.intervalCount,
    price_cents: option.priceCents,
    currency: 'usd',
    is_default: index === 0,
  }));

  const { data: priceRows, error: priceError } = await supabase
    .from('membership_plan_prices')
    .insert(priceInserts)
    .select('*');

  if (priceError) {
    await supabase.from('membership_plans').delete().eq('id', planRow.id);
    return { ok: false, error: priceError.message };
  }

  return {
    ok: true,
    plan: mapMembershipPlanToOwner(planRow, priceRows ?? []),
  };
}
