import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const TAP_TO_PAY_NOT_READY = 'Set up Stripe payments to use Tap to Pay.';

export type ResolveMerchantTapToPayPaymentAccountResult =
  | { ok: true; stripeAccountId: string }
  | { ok: false; httpStatus: number; error: string };

interface PaymentAccountRow {
  stripe_account_id?: string | null;
  charges_enabled?: boolean | null;
  onboarding_status?: string | null;
}

/**
 * Merchant-scoped Connect preconditions for Tap to Pay warm-up (no booking).
 */
export async function resolveMerchantTapToPayPaymentAccount(opts: {
  supabase: SupabaseClient<Database>;
  businessId: string;
}): Promise<ResolveMerchantTapToPayPaymentAccountResult> {
  const { data, error } = await paymentAccountsOf(opts.supabase)
    .select('stripe_account_id, charges_enabled, onboarding_status')
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (error) {
    console.error('[tap-to-pay:merchant] load payment_accounts failed', error);
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not load payment account.',
    };
  }

  const row = data as PaymentAccountRow | null;
  const stripeAccountId = row?.stripe_account_id?.trim() ?? '';
  const chargesEnabled = row?.charges_enabled === true;
  const onboardingComplete = row?.onboarding_status?.trim() === 'complete';

  if (!stripeAccountId || !chargesEnabled || !onboardingComplete) {
    return {
      ok: false,
      httpStatus: 422,
      error: TAP_TO_PAY_NOT_READY,
    };
  }

  return { ok: true, stripeAccountId };
}
