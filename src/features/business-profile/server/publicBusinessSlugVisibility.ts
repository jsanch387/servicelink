import {
  isPublicBusinessProfileLive,
  type PublicProfileLiveOwnerFields,
} from '@/features/pricing/utils/publicBusinessProfileLive';
import type { SupabaseClient } from '@supabase/supabase-js';

const OWNER_FIELDS_FOR_PUBLIC_LIVE =
  'onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id';

/**
 * Resolves whether a business slug should be served on the public internet.
 * Uses service role (caller-supplied admin client) to read `profiles` regardless of RLS.
 */
export async function isPublicBusinessSlugVisible(
  admin: SupabaseClient,
  slug: string
): Promise<boolean> {
  const trimmed = slug.trim();
  if (!trimmed) return false;

  const { data: biz, error: bizError } = await admin
    .from('business_profiles')
    .select('profile_id')
    .eq('business_slug', trimmed)
    .maybeSingle();

  if (bizError || !biz) return false;

  const profileId = (biz as { profile_id: string | null }).profile_id?.trim();
  if (!profileId) {
    // Legacy rows without an owner link — keep prior permissive behavior.
    return true;
  }

  const { data: owner } = await admin
    .from('profiles')
    .select(OWNER_FIELDS_FOR_PUBLIC_LIVE)
    .eq('user_id', profileId)
    .maybeSingle();

  if (!owner) return false;

  return isPublicBusinessProfileLive(owner as PublicProfileLiveOwnerFields);
}
