import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Connected Stripe account for a business (required for membership catalog sync).
 */
export async function getBusinessStripeConnectAccountId(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<
  { ok: true; stripeAccountId: string } | { ok: false; error: string }
> {
  const { data, error } = await paymentAccountsOf(supabase)
    .select('stripe_account_id, onboarding_status, charges_enabled')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const stripeAccountId = data?.stripe_account_id?.trim() ?? '';
  if (
    !stripeAccountId ||
    data?.onboarding_status !== 'complete' ||
    data?.charges_enabled !== true
  ) {
    return {
      ok: false,
      error: 'Finish Stripe setup before offering subscriptions.',
    };
  }

  return { ok: true, stripeAccountId };
}
