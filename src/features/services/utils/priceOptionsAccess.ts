import { isProAccess } from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Price options access policy:
 * - Pro users always have access.
 * - Free users are grandfathered if their business already used price options.
 */
export async function hasPriceOptionsAccess(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  businessId: string;
}): Promise<boolean> {
  const { supabase, userId, businessId } = params;

  const profileResult = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const profileRow = profileResult.data as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
  } | null;

  if (
    isProAccess(
      profileRow?.subscription_tier,
      profileRow?.subscription_current_period_end
    )
  ) {
    return true;
  }

  const [servicesWithEnabledFlagResult, priceOptionsRowsResult] =
    await Promise.all([
      supabase
        .from('business_services')
        .select('id')
        .eq('business_id', businessId)
        .eq('price_options_enabled', true)
        .limit(1),
      supabase
        .from('service_price_options')
        .select('id')
        .eq('business_id', businessId)
        .limit(1),
    ]);

  const hasEnabledService =
    (servicesWithEnabledFlagResult.data?.length ?? 0) > 0;
  const hasPriceOptionsRows = (priceOptionsRowsResult.data?.length ?? 0) > 0;

  return hasEnabledService || hasPriceOptionsRows;
}
