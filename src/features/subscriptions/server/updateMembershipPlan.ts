import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { formatCadenceOptionLabel } from '../utils/formatSubscriptionPrice';
import type { CreateMembershipPlanInput } from './createMembershipPlan';
import { countActivePriceSubscribers } from './countActivePlanSubscribers';
import { getBusinessStripeConnectAccountId } from './getBusinessStripeConnectAccountId';
import {
  mapMembershipPlanToOwner,
  normalizePlanDescriptionForStorage,
} from './mapMembershipPlanRow';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  archiveRemovedMembershipStripePrices,
  syncMembershipPlanStripeCatalog,
} from './syncMembershipPlanStripeCatalog';

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
  input: CreateMembershipPlanInput,
  requestId?: string
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

  const connect = await getBusinessStripeConnectAccountId(supabase, businessId);
  if (!connect.ok) {
    logMemberships(requestId, 'warn', 'update.connect_missing', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      reason: connect.error.slice(0, 120),
    });
    return { ok: false, error: connect.error };
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

  const toDelete = existingPrices.filter(
    price =>
      !nextKeys.has(cadenceKey(price.interval_unit, price.interval_count))
  );

  // Block removing a cadence that still has active subscribers.
  for (const price of toDelete) {
    const activeOnPrice = await countActivePriceSubscribers(
      supabase,
      businessId,
      price.id
    );
    if (activeOnPrice > 0) {
      const label = formatCadenceOptionLabel({
        intervalUnit: price.interval_unit as 'week' | 'month' | 'year',
        intervalCount: price.interval_count,
      });
      const reason =
        activeOnPrice === 1
          ? `Can't remove ${label} — 1 customer is still subscribed to that option.`
          : `Can't remove ${label} — ${activeOnPrice} customers are still subscribed to that option.`;
      logMemberships(requestId, 'warn', 'update.cadence_remove_blocked', {
        businessId: shortIdForLog(businessId),
        planId: shortIdForLog(planId),
        priceId: shortIdForLog(price.id),
        activeOnPrice,
        reason: reason.slice(0, 120),
      });
      return { ok: false, error: reason };
    }
  }

  const description = normalizePlanDescriptionForStorage(input.description);

  const planUpdate = {
    name,
    description,
    visit_duration_minutes:
      input.visitDurationMinutes ?? MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT,
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

  if (toDelete.length > 0) {
    await archiveRemovedMembershipStripePrices(
      connect.stripeAccountId,
      toDelete,
      requestId
    );

    const { error: deleteError } = await supabase
      .from('membership_plan_prices')
      .delete()
      .in(
        'id',
        toDelete.map(price => price.id)
      )
      .eq('business_id', businessId);

    if (deleteError) {
      logMemberships(requestId, 'error', 'update.cadence_delete_failed', {
        businessId: shortIdForLog(businessId),
        planId: shortIdForLog(planId),
        removedCount: toDelete.length,
        ...supabaseErrorForLogs(deleteError),
      });
      return { ok: false, error: deleteError.message };
    }
  }

  const sync = await syncMembershipPlanStripeCatalog(
    supabase,
    connect.stripeAccountId,
    planRow,
    updatedPrices,
    requestId
  );

  if (!sync.ok) {
    logMemberships(requestId, 'error', 'update.stripe_sync_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      stripeAccountId: shortStripeIdForLog(connect.stripeAccountId),
      reason: sync.error.slice(0, 120),
    });
    return { ok: false, error: sync.error };
  }

  return {
    ok: true,
    plan: mapMembershipPlanToOwner(sync.plan, sync.prices),
  };
}
