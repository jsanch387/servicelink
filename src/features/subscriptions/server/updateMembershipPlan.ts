import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import type { CreateMembershipPlanInput } from './createMembershipPlan';
import {
  mapMembershipPlanToOwner,
  splitDescriptionAndBenefits,
} from './mapMembershipPlanRow';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];
type PlanUpdate = Database['public']['Tables']['membership_plans']['Update'];
type PriceInsert =
  Database['public']['Tables']['membership_plan_prices']['Insert'];
type PriceUpdate =
  Database['public']['Tables']['membership_plan_prices']['Update'];

function cadenceKey(unit: string, count: number): string {
  return `${unit}:${count}`;
}

export async function updateMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string,
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

  const { data: existingPlan, error: existingError } = await supabase
    .from('membership_plans')
    .select('id')
    .eq('id', planId)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }
  if (!existingPlan) {
    return { ok: false, error: 'Plan not found.' };
  }

  const { description, benefits } = splitDescriptionAndBenefits(
    input.description
  );

  const planUpdate = {
    name,
    description,
    benefits,
  } satisfies PlanUpdate;

  const { data: planData, error: planError } = await supabase
    .from('membership_plans')
    // Local Database types currently resolve membership writes to `never`.
    .update(planUpdate as never)
    .eq('id', planId)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .select('*')
    .single();

  const planRow = planData as PlanRow | null;
  if (planError || !planRow) {
    return {
      ok: false,
      error: planError?.message ?? 'Could not update plan.',
    };
  }

  const { data: priceData, error: pricesLoadError } = await supabase
    .from('membership_plan_prices')
    .select('*')
    .eq('plan_id', planId)
    .eq('business_id', businessId);

  if (pricesLoadError) {
    return { ok: false, error: pricesLoadError.message };
  }

  const existingPrices = (priceData ?? []) as PriceRow[];
  const existingByKey = new Map(
    existingPrices.map(price => [
      cadenceKey(price.interval_unit, price.interval_count),
      price,
    ])
  );
  const nextKeys = new Set(
    input.cadenceOptions.map(option =>
      cadenceKey(option.intervalUnit, option.intervalCount)
    )
  );

  const updatedPrices: PriceRow[] = [];

  for (let index = 0; index < input.cadenceOptions.length; index += 1) {
    const option = input.cadenceOptions[index]!;
    const key = cadenceKey(option.intervalUnit, option.intervalCount);
    const existing = existingByKey.get(key);
    const isDefault = index === 0;

    if (existing) {
      const priceUpdate = {
        price_cents: option.priceCents,
        is_default: isDefault,
      } satisfies PriceUpdate;

      const { data: updatedData, error: updateError } = await supabase
        .from('membership_plan_prices')
        .update(priceUpdate as never)
        .eq('id', existing.id)
        .eq('business_id', businessId)
        .select('*')
        .single();

      const updated = updatedData as PriceRow | null;
      if (updateError || !updated) {
        return {
          ok: false,
          error: updateError?.message ?? 'Could not update pricing.',
        };
      }
      updatedPrices.push(updated);
    } else {
      const priceInsert = {
        plan_id: planId,
        business_id: businessId,
        interval_unit: option.intervalUnit,
        interval_count: option.intervalCount,
        price_cents: option.priceCents,
        currency: 'usd',
        is_default: isDefault,
      } satisfies PriceInsert;

      const { data: insertedData, error: insertError } = await supabase
        .from('membership_plan_prices')
        .insert(priceInsert as never)
        .select('*')
        .single();

      const inserted = insertedData as PriceRow | null;
      if (insertError || !inserted) {
        return {
          ok: false,
          error: insertError?.message ?? 'Could not add pricing.',
        };
      }
      updatedPrices.push(inserted);
    }
  }

  const toDelete = existingPrices.filter(
    price =>
      !nextKeys.has(cadenceKey(price.interval_unit, price.interval_count))
  );

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('membership_plan_prices')
      .delete()
      .in(
        'id',
        toDelete.map(price => price.id)
      )
      .eq('business_id', businessId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }
  }

  return {
    ok: true,
    plan: mapMembershipPlanToOwner(planRow, updatedPrices),
  };
}
