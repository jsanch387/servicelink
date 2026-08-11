import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionCadenceOption } from '../types/customerSubscriptionPlan';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { getBusinessStripeConnectAccountId } from './getBusinessStripeConnectAccountId';
import {
  mapMembershipPlanToOwner,
  splitDescriptionAndBenefits,
} from './mapMembershipPlanRow';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import { syncMembershipPlanStripeCatalog } from './syncMembershipPlanStripeCatalog';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];

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
    logMemberships(requestId, 'warn', 'create.connect_missing', {
      businessId: shortIdForLog(businessId),
      reason: connect.error.slice(0, 120),
    });
    return { ok: false, error: connect.error };
  }

  const { description, benefits } = splitDescriptionAndBenefits(
    input.description
  );

  const { data: planData, error: planError } = await membershipPlansOf(supabase)
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

  const planRow = planData as PlanRow | null;
  if (planError || !planRow) {
    logMemberships(requestId, 'error', 'create.plan_insert_failed', {
      businessId: shortIdForLog(businessId),
      ...supabaseErrorForLogs(planError),
    });
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

  const { data: priceData, error: priceError } = await membershipPlanPricesOf(
    supabase
  )
    .insert(priceInserts)
    .select('*');

  const priceRows = (priceData ?? []) as PriceRow[];
  if (priceError) {
    await membershipPlansOf(supabase).delete().eq('id', planRow.id);
    logMemberships(requestId, 'error', 'create.prices_insert_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planRow.id),
      rolledBack: true,
      ...supabaseErrorForLogs(priceError),
    });
    return { ok: false, error: priceError.message };
  }

  const sync = await syncMembershipPlanStripeCatalog(
    supabase,
    connect.stripeAccountId,
    planRow,
    priceRows,
    requestId
  );

  if (!sync.ok) {
    await membershipPlansOf(supabase).delete().eq('id', planRow.id);
    logMemberships(requestId, 'error', 'create.stripe_sync_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planRow.id),
      stripeAccountId: shortStripeIdForLog(connect.stripeAccountId),
      rolledBack: true,
      reason: sync.error.slice(0, 120),
    });
    return { ok: false, error: sync.error };
  }

  return {
    ok: true,
    plan: mapMembershipPlanToOwner(sync.plan, sync.prices),
  };
}
