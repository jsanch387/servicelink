import { buildTerminalLocationAddress } from '@/features/payments/server/buildTerminalLocationAddress';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import { getStripeConnectClient, getStripePlatform } from '@/libs/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export type EnsureTerminalLocationResult =
  | {
      ok: true;
      terminalLocationId: string;
      stripeAccountId: string;
      merchantDisplayName: string;
    }
  | { ok: false; error: string; httpStatus: number };

interface PaymentAccountRow {
  stripe_account_id?: string | null;
  stripe_terminal_location_id?: string | null;
  charges_enabled?: boolean | null;
}

interface BusinessProfileRow {
  business_name: string;
  service_area: string | null;
}

const TAP_TO_PAY_SETUP_ERROR =
  "Couldn't set up Tap to Pay. Try again or mark as paid.";

/**
 * Ensures the business has a Stripe Terminal Location on its Connect account.
 * Creates one server-side when missing; reuses the persisted `tml_…` id.
 */
export async function ensureTerminalLocation(opts: {
  supabase: SupabaseClient<Database>;
  businessId: string;
}): Promise<EnsureTerminalLocationResult> {
  const { data: accountRow, error: accountError } = await paymentAccountsOf(
    opts.supabase
  )
    .select('stripe_account_id, stripe_terminal_location_id, charges_enabled')
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (accountError) {
    console.error(
      '[terminal-location] load payment_accounts failed',
      accountError
    );
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not load payment account.',
    };
  }

  const row = accountRow as PaymentAccountRow | null;
  const stripeAccountId = row?.stripe_account_id?.trim();
  const chargesEnabled = row?.charges_enabled === true;

  if (!stripeAccountId || !chargesEnabled) {
    return {
      ok: false,
      httpStatus: 422,
      error: 'Set up Stripe payments to use Tap to Pay.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData, error: profileError } = await (
    opts.supabase as any
  )
    .from('business_profiles')
    .select('business_name, service_area')
    .eq('id', opts.businessId)
    .maybeSingle();

  if (profileError) {
    console.error(
      '[terminal-location] load business_profiles failed',
      profileError
    );
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not load business profile.',
    };
  }

  const profile = (profileData as BusinessProfileRow | null) ?? {
    business_name: 'Business',
    service_area: null,
  };
  const merchantDisplayName = profile.business_name?.trim() || 'Business';

  const stripe = getStripeConnectClient(stripeAccountId);
  const platformStripe = getStripePlatform();
  const existingLocationId = row?.stripe_terminal_location_id?.trim();

  if (existingLocationId) {
    try {
      await stripe.terminal.locations.retrieve(existingLocationId);
      return {
        ok: true,
        terminalLocationId: existingLocationId,
        stripeAccountId,
        merchantDisplayName,
      };
    } catch (e) {
      console.warn(
        '[terminal-location] stale location id, recreating',
        existingLocationId,
        e
      );
    }
  }

  let stripeAccount = null;
  try {
    stripeAccount = await platformStripe.accounts.retrieve(stripeAccountId);
  } catch (e) {
    console.warn('[terminal-location] accounts.retrieve failed', e);
  }

  const address = buildTerminalLocationAddress(profile, stripeAccount);

  let location;
  try {
    location = await stripe.terminal.locations.create({
      display_name: merchantDisplayName.slice(0, 100),
      address,
    });
    console.info('[terminal-location] locations.create', {
      stripeAccount: stripeAccountId,
      locationId: location.id,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Stripe Terminal location create failed';
    console.error('[terminal-location] locations.create failed', message);
    return {
      ok: false,
      httpStatus: 500,
      error: TAP_TO_PAY_SETUP_ERROR,
    };
  }

  const terminalLocationId = location.id?.trim();
  if (!terminalLocationId) {
    return {
      ok: false,
      httpStatus: 500,
      error: TAP_TO_PAY_SETUP_ERROR,
    };
  }

  const { error: updateError } = await paymentAccountsOf(opts.supabase)
    .update({
      stripe_terminal_location_id: terminalLocationId,
      tap_to_pay_ready: true,
    })
    .eq('business_id', opts.businessId);

  if (updateError) {
    console.error(
      '[terminal-location] payment_accounts update failed',
      updateError
    );
    return {
      ok: false,
      httpStatus: 500,
      error: TAP_TO_PAY_SETUP_ERROR,
    };
  }

  return {
    ok: true,
    terminalLocationId,
    stripeAccountId,
    merchantDisplayName,
  };
}
