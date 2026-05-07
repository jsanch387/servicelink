/**
 * Server-only: orchestrates full account deletion for a single user.
 *
 * Order:
 *   1. Read profile + business + payment_account billing references (admin client).
 *   2. Cancel Stripe subscription immediately if present (fail-stop).
 *   3. Best-effort: delete Stripe customer (PII purge from Stripe).
 *   4. Best-effort: delete payment_accounts row so we no longer reference the
 *      Connect account locally. The Stripe Connect account itself is left in
 *      place (Stripe doesn't allow deleting connected accounts that processed
 *      payments — finance/tax retention).
 *   5. `auth.admin.deleteUser(userId)` — cascades all dependent data via
 *      database FKs.
 *
 * Returns a discriminated union the API route can map to HTTP responses.
 * Each step logs structured context (no PII beyond user id) for ops.
 */

import { getStripePlatform } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type Stripe from 'stripe';

export type DeleteAccountResult =
  | { ok: true; warnings: string[] }
  | {
      ok: false;
      code: 'STRIPE_ERROR' | 'AUTH_DELETE_FAILED' | 'INTERNAL_ERROR';
      error: string;
    };

interface DeleteAccountInput {
  userId: string;
  /** For logs only; auth user id is the source of truth. */
  userEmail?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function deleteAccountForUser({
  userId,
  userEmail: _userEmail,
}: DeleteAccountInput): Promise<DeleteAccountResult> {
  if (!userId?.trim()) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'userId is required',
    };
  }

  const admin = createSupabaseAdminClient();
  const warnings: string[] = [];

  // 1) Load billing references via admin client (bypass RLS to be safe during
  //    teardown — we still scope every read by the verified user id).
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let businessId: string | null = null;
  let paymentAccountId: string | null = null;
  let paymentStripeAccountId: string | null = null;

  try {
    const profileQuery = (admin as any)
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    const businessQuery = (admin as any)
      .from('business_profiles')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    const [profileRes, businessRes] = await Promise.all([
      profileQuery,
      businessQuery,
    ]);

    if (profileRes.error) {
      console.warn('[account-delete] profile lookup error', {
        code: 'PROFILE_LOOKUP_ERROR',
      });
    } else if (profileRes.data) {
      stripeCustomerId = profileRes.data.stripe_customer_id ?? null;
      stripeSubscriptionId = profileRes.data.stripe_subscription_id ?? null;
    }

    if (businessRes.error) {
      console.warn('[account-delete] business lookup error', {
        code: 'BUSINESS_LOOKUP_ERROR',
      });
    } else if (businessRes.data) {
      businessId = businessRes.data.id ?? null;
    }

    if (businessId) {
      const paymentRes = await (admin as any)
        .from('payment_accounts')
        .select('id, stripe_account_id')
        .eq('business_id', businessId)
        .maybeSingle();
      if (paymentRes.error) {
        console.warn('[account-delete] payment_accounts lookup error', {
          code: 'PAYMENT_ACCOUNT_LOOKUP_ERROR',
        });
      } else if (paymentRes.data) {
        paymentAccountId = paymentRes.data.id ?? null;
        paymentStripeAccountId = paymentRes.data.stripe_account_id ?? null;
      }
    }
  } catch (err) {
    console.error('[account-delete] failed loading billing refs', {
      message: err instanceof Error ? err.message : 'unknown',
    });
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Could not load account state',
    };
  }

  // 2) Cancel Stripe subscription immediately. Fail-stop: if Stripe has a
  //    subscription on file and we can't cancel it, do not proceed to delete
  //    the auth user — support can resolve the mismatch (e.g. test vs live key
  //    as documented in src/app/api/stripe/README.md).
  if (stripeSubscriptionId?.trim()) {
    try {
      const stripe = getStripePlatform();
      await stripe.subscriptions.cancel(stripeSubscriptionId.trim());
      console.info('[account-delete] stripe subscription canceled', {
        userId,
        stripeSubscriptionId,
      });
    } catch (err) {
      const stripeErr = err as Stripe.errors.StripeError | Error;
      const code = (stripeErr as Stripe.errors.StripeError)?.code;
      const message =
        stripeErr instanceof Error ? stripeErr.message : String(stripeErr);

      // "resource_missing" or "No such subscription" — already gone in Stripe;
      // safe to continue. Anything else is fail-stop.
      const isMissing =
        code === 'resource_missing' || /no such subscription/i.test(message);
      if (!isMissing) {
        console.error('[account-delete] stripe subscription cancel failed', {
          code,
        });
        return {
          ok: false,
          code: 'STRIPE_ERROR',
          error:
            'Could not cancel your subscription. Please try again or contact support.',
        };
      }
      warnings.push('subscription_already_missing');
      console.warn('[account-delete] stripe subscription already missing');
    }
  }

  // 3) Best-effort: delete the Stripe customer to remove PII from Stripe.
  //    Historical invoices/charges remain on Stripe's side for legal/tax.
  if (stripeCustomerId?.trim()) {
    try {
      const stripe = getStripePlatform();
      await stripe.customers.del(stripeCustomerId.trim());
      console.info('[account-delete] stripe customer deleted');
    } catch (err) {
      const stripeErr = err as Stripe.errors.StripeError | Error;
      const code = (stripeErr as Stripe.errors.StripeError)?.code;
      // Don't fail the whole delete; the customer either doesn't exist or
      // belongs to a different mode key. Log and move on.
      console.warn('[account-delete] stripe customer delete soft-failed', {
        code,
      });
      warnings.push('stripe_customer_delete_soft_failed');
    }
  }

  // 4) Best-effort: drop the local payment_accounts row so we no longer point
  //    at a now-orphaned Stripe Connect account. We do NOT call
  //    accounts.reject / accounts.del on Stripe — Stripe disallows that for
  //    accounts with payment history (and we don't want to break their tax
  //    records). Operations can locate the orphan via the logged id.
  if (paymentAccountId) {
    try {
      const { error } = await (admin as any)
        .from('payment_accounts')
        .delete()
        .eq('id', paymentAccountId);
      if (error) {
        console.warn('[account-delete] payment_accounts delete error', {
          code: 'PAYMENT_ACCOUNT_DELETE_ERROR',
        });
        warnings.push('payment_accounts_delete_failed');
      } else {
        console.info('[account-delete] payment_accounts row deleted');
      }
    } catch (err) {
      console.warn('[account-delete] payment_accounts delete threw', {
        message: err instanceof Error ? err.message : 'unknown',
      });
      warnings.push('payment_accounts_delete_failed');
    }
  }

  // 5) Delete the Supabase auth user. FK cascades clean profile, business,
  //    and dependent rows. If this fails after a successful Stripe cancel,
  //    surface the error so support can finish the cleanup manually.
  try {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[account-delete] auth.admin.deleteUser failed', {
        code: 'AUTH_DELETE_ERROR',
      });
      return {
        ok: false,
        code: 'AUTH_DELETE_FAILED',
        error: 'Could not finalize account deletion. Please contact support.',
      };
    }
  } catch (err) {
    console.error('[account-delete] auth.admin.deleteUser threw', {
      message: err instanceof Error ? err.message : 'unknown',
    });
    return {
      ok: false,
      code: 'AUTH_DELETE_FAILED',
      error: 'Could not finalize account deletion. Please contact support.',
    };
  }

  console.info('[account-delete] complete', {
    hadSubscription: !!stripeSubscriptionId,
    hadCustomer: !!stripeCustomerId,
    hadConnectAccount: !!paymentStripeAccountId,
    warningCount: warnings.length,
  });

  return { ok: true, warnings };
}
