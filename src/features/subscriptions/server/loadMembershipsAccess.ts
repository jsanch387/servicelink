import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isOwnerEmailAllowedForMembershipsRollout } from '../config/membershipsRolloutAllowlist';
import {
  resolveMembershipsAccessGate,
  type MembershipsAccess,
} from '../types/membershipsAccess';

export async function loadMembershipsAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  businessId: string,
  ownerEmail?: string | null
): Promise<MembershipsAccess> {
  let email = ownerEmail;
  if (email === undefined) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  const inRollout = isOwnerEmailAllowedForMembershipsRollout(email);
  const hasProAccess = await getHasProAccessForPayments(supabase, userId);

  const { data: paymentAccount } = await paymentAccountsOf(supabase)
    .select('onboarding_status, charges_enabled, stripe_account_id')
    .eq('business_id', businessId)
    .maybeSingle();

  const stripeConnectReady =
    paymentAccount?.onboarding_status === 'complete' &&
    paymentAccount?.charges_enabled === true;

  const stripeConnectResume =
    hasProAccess &&
    !stripeConnectReady &&
    !!paymentAccount?.stripe_account_id?.trim();

  const stripeConnectRestricted =
    paymentAccount?.onboarding_status === 'restricted';

  const { data: paymentSettingsRow } = await paymentSettingsOf(supabase)
    .select('payments_enabled')
    .eq('business_id', businessId)
    .maybeSingle();

  const paymentsEnabled = paymentSettingsRow?.payments_enabled === true;

  return {
    gate: resolveMembershipsAccessGate({
      inRollout,
      hasProAccess,
      stripeConnectReady,
      paymentsEnabled,
    }),
    inRollout,
    hasProAccess,
    stripeConnectReady,
    stripeConnectResume,
    stripeConnectRestricted,
    paymentsEnabled,
  };
}
