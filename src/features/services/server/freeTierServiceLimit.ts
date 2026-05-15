/**
 * Free-tier limit: max active service rows per business for non–Pro owners.
 * Grandfather: businesses that already have more than FREE_MAX_SERVICES may keep
 * that count but cannot increase it without Pro (onboarding replace-all uses the same rule).
 */

import { isProAccess } from '@/features/pricing';
import { FREE_MAX_SERVICES, FREE_TIER_SERVICE_LIMIT_USER_MESSAGE } from '@/features/pricing/types';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const FREE_TIER_SERVICE_LIMIT_MESSAGE =
  FREE_TIER_SERVICE_LIMIT_USER_MESSAGE;

/** Max service rows allowed after a replace-all on Free (grandfather existing larger counts). */
export function maxServiceCountAllowedOnFreeTier(currentDbCount: number): number {
  return Math.max(FREE_MAX_SERVICES, currentDbCount);
}

export function assertFreeTierReplaceAllServiceCount(
  currentDbCount: number,
  nextCount: number,
  ownerHasProAccess: boolean
): { ok: true } | { ok: false; error: string } {
  if (ownerHasProAccess) return { ok: true };
  const maxAllowed = maxServiceCountAllowedOnFreeTier(currentDbCount);
  if (nextCount > maxAllowed) {
    return { ok: false, error: FREE_TIER_SERVICE_LIMIT_MESSAGE };
  }
  return { ok: true };
}

type ProfileAccessRow = {
  subscription_tier?: string | null;
  subscription_current_period_end?: string | null;
  subscription_status?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
};

export async function ownerHasProAccessForServices(
  supabase: SupabaseClient<Database>,
  ownerUserId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', ownerUserId.trim())
    .maybeSingle();
  const row = data as ProfileAccessRow | null;
  return isProAccess(
    row?.subscription_tier,
    row?.subscription_current_period_end,
    row?.subscription_status,
    row?.stripe_subscription_id,
    row?.stripe_customer_id
  );
}

/**
 * Blocks creating one more service when the owner is not Pro and already at the cap.
 */
export async function assertCanAddBusinessService(
  supabase: SupabaseClient<Database>,
  businessId: string,
  ownerUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pro = await ownerHasProAccessForServices(supabase, ownerUserId);
  if (pro) return { ok: true };

  const { count, error } = await supabase
    .from('business_services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId.trim());

  if (error) {
    return {
      ok: false,
      error: 'Could not verify your plan limits. Try again.',
    };
  }
  const n = count ?? 0;
  if (n >= FREE_MAX_SERVICES) {
    return { ok: false, error: FREE_TIER_SERVICE_LIMIT_MESSAGE };
  }
  return { ok: true };
}

export async function resolveBusinessOwnerUserId(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId.trim())
    .maybeSingle();
  const pid = data as { profile_id?: string | null } | null;
  const id = pid?.profile_id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}
