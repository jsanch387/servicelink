/**
 * Verify a Tap to Pay PaymentIntent is a direct charge on the connected account
 * (not a platform-scoped PI with on_behalf_of / transfer_data).
 */

import { getStripeConnectClient, getStripePlatform } from '@/libs/stripe';
import type Stripe from 'stripe';

export type VerifyTapToPayDirectChargeScopeResult =
  | { ok: true; diagnostics: TapToPayDirectChargeDiagnostics }
  | { ok: false; error: string; diagnostics?: TapToPayDirectChargeDiagnostics };

export interface TapToPayDirectChargeDiagnostics {
  paymentIntentId: string;
  stripeAccountId: string;
  onBehalfOf: string | null;
  transferDestination: string | null;
  retrievableOnConnectedAccount: boolean;
  retrievableOnPlatformAccount: boolean;
}

function readConnectAccountRef(
  value: string | Stripe.Account | null | undefined
): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  const id = value?.id?.trim();
  return id || null;
}

export function summarizePaymentIntentScope(
  pi: Stripe.PaymentIntent
): Pick<TapToPayDirectChargeDiagnostics, 'onBehalfOf' | 'transferDestination'> {
  return {
    onBehalfOf: readConnectAccountRef(pi.on_behalf_of),
    transferDestination: readConnectAccountRef(pi.transfer_data?.destination),
  };
}

export async function verifyTapToPayDirectChargeOnConnectedAccount(opts: {
  paymentIntentId: string;
  stripeAccountId: string;
}): Promise<VerifyTapToPayDirectChargeScopeResult> {
  const paymentIntentId = opts.paymentIntentId.trim();
  const stripeAccountId = opts.stripeAccountId.trim();
  if (!paymentIntentId || !stripeAccountId) {
    return { ok: false, error: 'PaymentIntent scope could not be verified.' };
  }

  const connectStripe = getStripeConnectClient(stripeAccountId);
  const platformStripe = getStripePlatform();

  let connectedPi: Stripe.PaymentIntent;
  try {
    connectedPi = await connectStripe.paymentIntents.retrieve(paymentIntentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'retrieve failed';
    console.error('[tap-to-pay] PI not on connected account', {
      paymentIntentId,
      stripeAccountId,
      message,
    });
    return {
      ok: false,
      error: 'PaymentIntent was not created on the connected account.',
    };
  }

  const scope = summarizePaymentIntentScope(connectedPi);
  const diagnostics: TapToPayDirectChargeDiagnostics = {
    paymentIntentId,
    stripeAccountId,
    onBehalfOf: scope.onBehalfOf,
    transferDestination: scope.transferDestination,
    retrievableOnConnectedAccount: true,
    retrievableOnPlatformAccount: false,
  };

  if (scope.onBehalfOf) {
    console.error('[tap-to-pay] PI uses on_behalf_of (platform charge)', {
      ...diagnostics,
    });
    return {
      ok: false,
      error:
        'PaymentIntent must be a direct charge on the connected account for Tap to Pay.',
      diagnostics,
    };
  }

  if (scope.transferDestination) {
    console.error('[tap-to-pay] PI uses transfer_data (destination charge)', {
      ...diagnostics,
    });
    return {
      ok: false,
      error:
        'PaymentIntent must be a direct charge on the connected account for Tap to Pay.',
      diagnostics,
    };
  }

  try {
    await platformStripe.paymentIntents.retrieve(paymentIntentId);
    diagnostics.retrievableOnPlatformAccount = true;
    console.error(
      '[tap-to-pay] PI retrievable on platform account',
      diagnostics
    );
    return {
      ok: false,
      error: 'PaymentIntent was created on the platform account.',
      diagnostics,
    };
  } catch {
    // Expected — direct charges are not visible on the platform account.
  }

  return { ok: true, diagnostics };
}
