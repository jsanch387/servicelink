import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const PAYMENT_LINKS_NOT_READY =
  'Set up Stripe payments to create a payment link.';

export type ResolveMerchantWalkUpPaymentAccountResult =
  | { ok: true; stripeAccountId: string }
  | { ok: false; httpStatus: number; error: string };

interface PaymentAccountRow {
  stripe_account_id?: string | null;
  charges_enabled?: boolean | null;
  onboarding_status?: string | null;
}

/** Same Connect gate as booking Tap to Pay: complete + charges enabled. */
export async function resolveMerchantWalkUpPaymentAccount(opts: {
  supabase: SupabaseClient<Database>;
  businessId: string;
}): Promise<ResolveMerchantWalkUpPaymentAccountResult> {
  const { data, error } = await paymentAccountsOf(opts.supabase)
    .select('stripe_account_id, charges_enabled, onboarding_status')
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (error) {
    console.error('[walk-up:payment-link] load payment_accounts failed', error);
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
      error: PAYMENT_LINKS_NOT_READY,
    };
  }

  return { ok: true, stripeAccountId };
}
