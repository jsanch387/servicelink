import type {
  Database,
  PaymentAccountOnboardingStatus,
} from '@/libs/supabase/client';
import { getStripePlatform } from '@/libs/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { logConnect } from './connectOnboardingLog';
import { ensureTerminalLocation } from './ensureTerminalLocation';
import { paymentAccountsOf } from './paymentAccountsQuery';

/**
 * Maps Stripe Connect account state to our `payment_accounts.onboarding_status`.
 */
export function deriveConnectOnboardingStatus(
  account: Stripe.Account
): PaymentAccountOnboardingStatus {
  if (account.requirements?.disabled_reason) {
    return 'restricted';
  }
  if (account.details_submitted && account.charges_enabled) {
    return 'complete';
  }
  return 'in_progress';
}

function snapshotRequirementsStatus(account: Stripe.Account): string | null {
  const r = account.requirements;
  if (!r) return null;
  if (r.disabled_reason) return `disabled:${r.disabled_reason}`;
  const past = r.past_due?.length ?? 0;
  const current = r.currently_due?.length ?? 0;
  if (past > 0 || current > 0) {
    return `due:past=${past},current=${current}`;
  }
  return null;
}

export type SyncConnectPaymentAccountResult =
  | { ok: true; skipped: true; reason: 'no_stripe_account' }
  | { ok: true; skipped: false }
  | { ok: false; error: string };

/**
 * Pulls the latest Connect account from Stripe and updates `payment_accounts`.
 * Call after `return_url` / `refresh_url` (and later from webhooks).
 */
export async function syncConnectPaymentAccountForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<SyncConnectPaymentAccountResult> {
  logConnect('sync.start', { businessId });

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    logConnect('sync.abort', { businessId, reason: 'missing_stripe_secret' });
    return { ok: false, error: 'Stripe is not configured' };
  }

  const { data: row, error: rowError } = await paymentAccountsOf(supabase)
    .select('id, stripe_account_id, connected_at')
    .eq('business_id', businessId)
    .maybeSingle();

  if (rowError) {
    logConnect('sync.load_row_failed', {
      businessId,
      message: rowError.message,
    });
    return { ok: false, error: rowError.message };
  }

  if (!row?.stripe_account_id?.trim()) {
    logConnect('sync.skipped', {
      businessId,
      reason: 'no_stripe_account',
    });
    return { ok: true, skipped: true, reason: 'no_stripe_account' };
  }

  const stripeAccountId = row.stripe_account_id.trim();

  const stripe = getStripePlatform();
  let account: Stripe.Account;
  try {
    account = await stripe.accounts.retrieve(stripeAccountId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe retrieve failed';
    logConnect('sync.stripe_retrieve_failed', {
      businessId,
      stripeAccountId,
      message,
    });
    return { ok: false, error: message };
  }

  logConnect('sync.stripe_snapshot', {
    businessId,
    stripeAccountId,
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
    disabled_reason: account.requirements?.disabled_reason ?? null,
  });

  const onboardingStatus = deriveConnectOnboardingStatus(account);
  const now = new Date().toISOString();
  const connectedAt =
    onboardingStatus === 'complete' && !row.connected_at ? now : undefined;

  const { error: updateError } = await paymentAccountsOf(supabase)
    .update({
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
      onboarding_status: onboardingStatus,
      requirements_status: snapshotRequirementsStatus(account),
      last_synced_at: now,
      ...(connectedAt ? { connected_at: connectedAt } : {}),
    })
    .eq('business_id', businessId);

  if (updateError) {
    logConnect('sync.db_update_failed', {
      businessId,
      stripeAccountId,
      message: updateError.message,
    });
    return { ok: false, error: updateError.message };
  }

  logConnect('sync.success', {
    businessId,
    stripeAccountId,
    onboarding_status: onboardingStatus,
    connected_at_set: Boolean(connectedAt),
    last_synced_at: now,
    requirements_status: snapshotRequirementsStatus(account),
  });

  if (onboardingStatus === 'complete' && (account.charges_enabled ?? false)) {
    const terminalResult = await ensureTerminalLocation({
      supabase,
      businessId,
    });
    if (!terminalResult.ok) {
      logConnect('sync.terminal_location_failed', {
        businessId,
        error: terminalResult.error,
      });
      console.warn(
        '[terminal-location] Connect sync succeeded but Terminal Location provisioning failed',
        { businessId, error: terminalResult.error }
      );
    } else {
      logConnect('sync.terminal_location_ok', {
        businessId,
        terminalLocationId: terminalResult.terminalLocationId,
      });
    }
  }

  return { ok: true, skipped: false };
}
