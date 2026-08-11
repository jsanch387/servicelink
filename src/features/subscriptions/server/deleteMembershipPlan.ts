import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { countActivePlanSubscribers } from './countActivePlanSubscribers';
import { getBusinessStripeConnectAccountId } from './getBusinessStripeConnectAccountId';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import { archiveMembershipPlanStripeCatalog } from './syncMembershipPlanStripeCatalog';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];

export type DeleteMembershipPlanResult =
  | { ok: true; activeSubscriberCount: number }
  | { ok: false; error: string; code?: 'not_found' | 'has_subscribers' };

/**
 * Soft-delete a plan (set `deleted_at`). Hides it from the booking link and
 * owner list. Archives Stripe Product + Prices on the connected account
 * (best-effort). Does not cancel existing customer subscriptions — when those
 * exist, delete is blocked so the owner must handle members first.
 */
export async function deleteMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string,
  requestId?: string
): Promise<DeleteMembershipPlanResult> {
  const id = planId?.trim();
  if (!id) {
    return { ok: false, error: 'Plan id is required.', code: 'not_found' };
  }

  const { data: existingData, error: existingError } = await membershipPlansOf(
    supabase
  )
    .select('id, stripe_product_id')
    .eq('id', id)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .maybeSingle();

  const existing = existingData as Pick<
    PlanRow,
    'id' | 'stripe_product_id'
  > | null;

  if (existingError) {
    logMemberships(requestId, 'error', 'delete.load_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(id),
      ...supabaseErrorForLogs(existingError),
    });
    return { ok: false, error: existingError.message };
  }
  if (!existing) {
    logMemberships(requestId, 'warn', 'delete.not_found', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(id),
    });
    return { ok: false, error: 'Plan not found.', code: 'not_found' };
  }

  const activeSubscriberCount = await countActivePlanSubscribers(
    supabase,
    businessId,
    id
  );

  if (activeSubscriberCount > 0) {
    const reason =
      activeSubscriberCount === 1
        ? 'This plan still has 1 active subscriber. Move or cancel them before deleting.'
        : `This plan still has ${activeSubscriberCount} active subscribers. Move or cancel them before deleting.`;
    logMemberships(requestId, 'warn', 'delete.blocked_subscribers', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(id),
      activeSubscriberCount,
      reason: reason.slice(0, 120),
    });
    return {
      ok: false,
      code: 'has_subscribers',
      error: reason,
    };
  }

  const { data: priceData } = await membershipPlanPricesOf(supabase)
    .select('stripe_price_id')
    .eq('plan_id', id)
    .eq('business_id', businessId);

  const priceRows = (priceData ?? []) as Array<
    Pick<PriceRow, 'stripe_price_id'>
  >;

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await membershipPlansOf(supabase)
    .update({ deleted_at: deletedAt })
    .eq('id', id)
    .eq('business_id', businessId)
    .is('deleted_at', null);

  if (updateError) {
    logMemberships(requestId, 'error', 'delete.soft_delete_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(id),
      ...supabaseErrorForLogs(updateError),
    });
    return { ok: false, error: updateError.message };
  }

  const connect = await getBusinessStripeConnectAccountId(supabase, businessId);
  if (connect.ok) {
    await archiveMembershipPlanStripeCatalog(
      connect.stripeAccountId,
      existing.stripe_product_id,
      priceRows.map(price => price.stripe_price_id),
      requestId
    );
  } else {
    logMemberships(requestId, 'warn', 'delete.stripe_archive_skipped', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(id),
      reason: connect.error.slice(0, 120),
    });
  }

  return { ok: true, activeSubscriberCount: 0 };
}
