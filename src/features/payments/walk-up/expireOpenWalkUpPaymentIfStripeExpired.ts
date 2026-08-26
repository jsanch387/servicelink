import { getStripePlatform } from '@/libs/stripe/platformClient';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WALKUP_PAYMENT_STATUS } from './constants';
import { paymentRequestsOf } from './paymentRequestsQuery';
import { resolveMerchantWalkUpPaymentAccount } from './resolveMerchantWalkUpPaymentAccount';

/**
 * If Stripe already expired the Checkout Session but the webhook has not
 * landed yet, mark the row expired so `/p/…` does not show Pay.
 */
export async function expireOpenWalkUpPaymentIfStripeExpired(
  admin: SupabaseClient<Database>,
  args: {
    paymentRequestId: string;
    businessId: string;
    checkoutSessionId: string | null;
    status: string;
  }
): Promise<string> {
  if (args.status !== WALKUP_PAYMENT_STATUS.OPEN) {
    return args.status;
  }

  const sessionId = args.checkoutSessionId?.trim() ?? '';
  if (!sessionId) {
    return args.status;
  }

  const account = await resolveMerchantWalkUpPaymentAccount({
    supabase: admin,
    businessId: args.businessId,
  });
  if (!account.ok) {
    return args.status;
  }

  try {
    const session = await getStripePlatform().checkout.sessions.retrieve(
      sessionId,
      { stripeAccount: account.stripeAccountId }
    );
    if (session.status !== 'expired') {
      return args.status;
    }
  } catch (error) {
    console.warn('[walk-up:payment-link] retrieve checkout session failed', {
      paymentRequestId: args.paymentRequestId,
      sessionId,
      error,
    });
    return args.status;
  }

  const { error } = await paymentRequestsOf(admin)
    .update({ status: WALKUP_PAYMENT_STATUS.EXPIRED })
    .eq('id', args.paymentRequestId)
    .eq('status', WALKUP_PAYMENT_STATUS.OPEN);

  if (error) {
    console.error('[walk-up:payment-link] mark expired on load failed', {
      paymentRequestId: args.paymentRequestId,
      sessionId,
      error,
    });
    return args.status;
  }

  return WALKUP_PAYMENT_STATUS.EXPIRED;
}
