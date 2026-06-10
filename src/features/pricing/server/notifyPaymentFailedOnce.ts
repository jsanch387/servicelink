/**
 * Server-only: send the "payment failed" email at most ONCE per failure episode.
 *
 * Stripe fires `invoice.payment_failed` on every automatic retry, so emailing on
 * each event would spam the owner. We guard with an atomic claim on
 * `profiles.payment_failed_email_sent_at`: the timestamp is set only where it is
 * still NULL, so retries of the same failure can't re-send. The flag is cleared
 * again when the subscription recovers to an active/granting state (see
 * `syncProfileFromSubscriptionUpdated` / `updateProfileFromCheckout`), so a later,
 * separate failure can notify again.
 *
 * Best-effort — never blocks the webhook. Do not import from client code.
 */

import { sendSubscriptionPaymentFailedEmail } from '@/features/email';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotifyPaymentFailedOnceParams {
  stripeSubscriptionId: string;
  /** Email from the failing Stripe invoice, if present (preferred recipient). */
  invoiceCustomerEmail?: string | null;
}

export interface NotifyPaymentFailedOnceResult {
  sent: boolean;
  /** Set when we intentionally did not send (not an error). */
  skippedReason?: string;
  error?: string;
}

export async function notifyPaymentFailedOnce(
  supabase: SupabaseClient,
  params: NotifyPaymentFailedOnceParams
): Promise<NotifyPaymentFailedOnceResult> {
  const subId = params.stripeSubscriptionId?.trim();
  if (!subId) {
    return { sent: false, error: 'stripeSubscriptionId is required' };
  }

  // Atomic claim: only the call that flips NULL -> now() proceeds to send.
  const claimedAt = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimed, error: claimError } = await (supabase as any)
    .from('profiles')
    .update({ payment_failed_email_sent_at: claimedAt })
    .eq('stripe_subscription_id', subId)
    .is('payment_failed_email_sent_at', null)
    .select('user_id');

  if (claimError) {
    return { sent: false, error: claimError.message };
  }
  if (!claimed?.length) {
    // Already notified this episode, or no profile maps to this subscription.
    return { sent: false, skippedReason: 'already_notified_or_no_profile' };
  }

  const userId =
    typeof claimed[0]?.user_id === 'string' ? claimed[0].user_id.trim() : '';

  const rollbackClaim = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ payment_failed_email_sent_at: null })
      .eq('stripe_subscription_id', subId)
      .eq('payment_failed_email_sent_at', claimedAt);
  };

  let email = params.invoiceCustomerEmail?.trim() || '';
  if (!email && userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authResult = await (supabase as any).auth.admin.getUserById(userId);
    const authEmail = authResult?.data?.user?.email;
    email = typeof authEmail === 'string' ? authEmail.trim() : '';
  }

  if (!email) {
    // Can't send without an address; release the claim so a retry can notify later.
    await rollbackClaim();
    return { sent: false, skippedReason: 'no_owner_email' };
  }

  const emailResult = await sendSubscriptionPaymentFailedEmail(email);
  if (!emailResult.sent) {
    await rollbackClaim();
    return { sent: false, error: emailResult.error ?? 'send failed' };
  }

  return { sent: true };
}
