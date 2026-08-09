import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { countActivePlanSubscribers } from './countActivePlanSubscribers';

export type DeleteMembershipPlanResult =
  | { ok: true; activeSubscriberCount: number }
  | { ok: false; error: string; code?: 'not_found' | 'has_subscribers' };

/**
 * Soft-delete a plan (set `deleted_at`). Hides it from the booking link and
 * owner list. Does not cancel existing customer subscriptions — when those
 * exist, delete is blocked so the owner must handle members first.
 */
export async function deleteMembershipPlanForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planId: string
): Promise<DeleteMembershipPlanResult> {
  const id = planId?.trim();
  if (!id) {
    return { ok: false, error: 'Plan id is required.', code: 'not_found' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('membership_plans')
    .select('id')
    .eq('id', id)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }
  if (!existing) {
    return { ok: false, error: 'Plan not found.', code: 'not_found' };
  }

  const activeSubscriberCount = await countActivePlanSubscribers(
    supabase,
    businessId,
    id
  );

  if (activeSubscriberCount > 0) {
    return {
      ok: false,
      code: 'has_subscribers',
      error:
        activeSubscriberCount === 1
          ? 'This plan still has 1 active subscriber. Move or cancel them before deleting.'
          : `This plan still has ${activeSubscriberCount} active subscribers. Move or cancel them before deleting.`,
    };
  }

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('membership_plans')
    .update({ deleted_at: deletedAt } as never)
    .eq('id', id)
    .eq('business_id', businessId)
    .is('deleted_at', null);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, activeSubscriberCount: 0 };
}
