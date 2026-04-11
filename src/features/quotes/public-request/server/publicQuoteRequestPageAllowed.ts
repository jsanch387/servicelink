import { isProAccess } from '@/features/pricing';
import type { SupabaseClient } from '@supabase/supabase-js';

type MinimalBusiness = {
  accept_quote_req: boolean | null;
  profile_id: string | null;
};

/**
 * Public `/[slug]/quote` and POST quote-request: business must opt in and owner must be Pro.
 */
export async function publicQuoteRequestAllowedForSlug(
  supabase: SupabaseClient,
  adminForProfiles: SupabaseClient,
  slug: string
): Promise<{ ok: true; businessId: string } | { ok: false }> {
  const { data: row, error } = await supabase
    .from('business_profiles')
    .select('id, accept_quote_req, profile_id')
    .eq('business_slug', slug)
    .maybeSingle();

  if (error || !row) {
    return { ok: false };
  }

  const biz = row as MinimalBusiness;
  if (biz.accept_quote_req !== true || !biz.profile_id) {
    return { ok: false };
  }

  const { data: ownerProfile } = await adminForProfiles
    .from('profiles')
    .select('subscription_tier, subscription_current_period_end')
    .eq('user_id', biz.profile_id)
    .maybeSingle();

  const tier = ownerProfile?.subscription_tier;
  const periodEnd = ownerProfile?.subscription_current_period_end;
  if (!isProAccess(tier, periodEnd)) {
    return { ok: false };
  }

  return { ok: true, businessId: (row as { id: string }).id };
}
