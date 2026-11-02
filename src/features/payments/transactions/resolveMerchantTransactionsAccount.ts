import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PAYMENTS_TRANSACTIONS_CONNECT_REQUIRED } from './constants';

export type ResolveMerchantTransactionsAccountResult =
  | { ok: true; stripeAccountId: string }
  | { ok: false; httpStatus: number; error: string };

/**
 * Owner can view history once Connect onboarding is complete.
 * Charges/payouts flags are not required — restricted accounts still have a ledger.
 */
export async function resolveMerchantTransactionsAccount(opts: {
  supabase: SupabaseClient<Database>;
  businessId: string;
}): Promise<ResolveMerchantTransactionsAccountResult> {
  const { data, error } = await paymentAccountsOf(opts.supabase)
    .select('stripe_account_id, onboarding_status')
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (error) {
    console.error(
      '[payments:transactions] load payment_accounts failed',
      error
    );
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not load payment account.',
    };
  }

  const row = data as {
    stripe_account_id?: string | null;
    onboarding_status?: string | null;
  } | null;
  const stripeAccountId = row?.stripe_account_id?.trim() ?? '';
  const onboardingComplete = row?.onboarding_status?.trim() === 'complete';

  if (!stripeAccountId || !onboardingComplete) {
    return {
      ok: false,
      httpStatus: 422,
      error: PAYMENTS_TRANSACTIONS_CONNECT_REQUIRED,
    };
  }

  return { ok: true, stripeAccountId };
}
