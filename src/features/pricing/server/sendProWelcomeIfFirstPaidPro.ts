/**
 * Server-only: send the "Welcome to Pro" email exactly once, on a user's FIRST
 * paid Pro upgrade. Best-effort — never blocks or rolls back the Pro upgrade.
 *
 * "First paid" = `subscription_tier === 'pro'`, `subscription_status === 'active'`,
 * and a `stripe_subscription_id` is present (so trials, which start as `trialing`,
 * do not trigger it until they convert to paid).
 *
 * Once-only is enforced by an **atomic claim** on `profiles.pro_welcome_email_sent_at`:
 * we set the timestamp only where it is still NULL and read back the affected row.
 * If we did not win the claim, another concurrent event already handled it. Because
 * cancel/downgrade never clears this column (and we always keep `stripe_customer_id`),
 * renewals and cancel→resubscribe can never re-fire the email.
 *
 * Do not import from client code.
 */

import { sendProWelcomeEmail } from '@/features/email';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SendProWelcomeIfFirstPaidProParams {
  /** Preferred lookup. */
  userId?: string;
  /** Used when only the Stripe subscription id is known (subscription.updated). */
  stripeSubscriptionId?: string;
}

export interface SendProWelcomeIfFirstPaidProResult {
  sent: boolean;
  /** Set when we intentionally did not send (not an error). */
  skippedReason?: string;
  error?: string;
}

function firstNameFromUser(user: unknown): string | undefined {
  const meta =
    (user as { user_metadata?: Record<string, unknown> } | null)
      ?.user_metadata ?? {};
  const raw =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.first_name === 'string' && meta.first_name) ||
    '';
  const first = raw.toString().trim().split(/\s+/)[0];
  return first || undefined;
}

export async function sendProWelcomeIfFirstPaidPro(
  supabase: SupabaseClient,
  params: SendProWelcomeIfFirstPaidProParams
): Promise<SendProWelcomeIfFirstPaidProResult> {
  const userIdInput = params.userId?.trim();
  const subIdInput = params.stripeSubscriptionId?.trim();
  if (!userIdInput && !subIdInput) {
    return { sent: false, error: 'userId or stripeSubscriptionId is required' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesQuery = (supabase as any)
    .from('profiles')
    .select(
      'user_id, subscription_tier, subscription_status, stripe_subscription_id, pro_welcome_email_sent_at'
    );
  const { data: row, error: loadError } = await (
    userIdInput
      ? profilesQuery.eq('user_id', userIdInput)
      : profilesQuery.eq('stripe_subscription_id', subIdInput)
  ).maybeSingle();

  if (loadError) {
    return { sent: false, error: loadError.message };
  }
  if (!row) {
    return { sent: false, skippedReason: 'no_profile' };
  }

  const userId =
    typeof row.user_id === 'string' ? row.user_id.trim() : (userIdInput ?? '');
  if (!userId) {
    return { sent: false, skippedReason: 'no_user_id' };
  }

  const tier =
    typeof row.subscription_tier === 'string'
      ? row.subscription_tier.trim().toLowerCase()
      : '';
  const status =
    typeof row.subscription_status === 'string'
      ? row.subscription_status.trim().toLowerCase()
      : '';
  const hasSubscription =
    typeof row.stripe_subscription_id === 'string' &&
    row.stripe_subscription_id.trim().length > 0;

  // Only on a genuine paid, active Pro. Trials (status `trialing`) are skipped
  // until they convert to `active`.
  if (tier !== 'pro' || status !== 'active' || !hasSubscription) {
    return { sent: false, skippedReason: 'not_paid_active_pro' };
  }

  // Fast path: already sent (the atomic claim below is the real guard).
  if (row.pro_welcome_email_sent_at != null) {
    return { sent: false, skippedReason: 'already_sent' };
  }

  // Atomic claim: only the call that flips NULL -> now() proceeds to send.
  const claimedAt = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimed, error: claimError } = await (supabase as any)
    .from('profiles')
    .update({ pro_welcome_email_sent_at: claimedAt })
    .eq('user_id', userId)
    .is('pro_welcome_email_sent_at', null)
    .select('user_id');

  if (claimError) {
    return { sent: false, error: claimError.message };
  }
  if (!claimed?.length) {
    // Someone else claimed it first (concurrent webhook) — do not double-send.
    return { sent: false, skippedReason: 'claim_lost' };
  }

  const rollbackClaim = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ pro_welcome_email_sent_at: null })
      .eq('user_id', userId)
      .eq('pro_welcome_email_sent_at', claimedAt);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authResult = await (supabase as any).auth.admin.getUserById(userId);
  const authUser = authResult?.data?.user ?? null;
  const email =
    typeof authUser?.email === 'string' ? authUser.email.trim() : '';
  if (!email) {
    // Cannot send without an address; release the claim so a later event can retry.
    await rollbackClaim();
    return { sent: false, skippedReason: 'no_owner_email' };
  }

  const emailResult = await sendProWelcomeEmail(email, {
    firstName: firstNameFromUser(authUser),
  });

  if (!emailResult.sent) {
    // Release the claim so a retry can send the welcome later.
    await rollbackClaim();
    return { sent: false, error: emailResult.error ?? 'send failed' };
  }

  return { sent: true };
}
