import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isStripeConnectReady } from '../utils/isStripeConnectReady';
import { paymentAccountsOf } from './paymentAccountsQuery';

export async function getBusinessStripeConnectReady(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<boolean> {
  const { data } = await paymentAccountsOf(supabase)
    .select('onboarding_status, charges_enabled')
    .eq('business_id', businessId)
    .maybeSingle();

  return isStripeConnectReady(data);
}
