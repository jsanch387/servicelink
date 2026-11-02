import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { verifyTapToPayDirectChargeOnConnectedAccount } from '@/features/availability/booking/server/verifyTapToPayDirectChargeOnConnectedAccount';
import { ensureTerminalLocation } from '@/features/payments/server/ensureTerminalLocation';
import { resolveMerchantTapToPayPaymentAccount } from '@/features/payments/server/resolveMerchantTapToPayPaymentAccount';
import { resolveMerchantTapToPayStripeAccountId } from '@/features/payments/server/resolveMerchantTapToPayStripeAccountId';
import { getStripeConnectClient } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertOwnerTapToPayIntentRateLimits,
  TAP_TO_PAY_RATE_LIMIT_ERROR,
} from '@/server/rateLimit/ownerTapToPayRateLimit';
import type { NextRequest } from 'next/server';
import {
  WALKUP_PAYMENT_COLLECTION_TAP_TO_PAY,
  WALKUP_PAYMENT_STATUS,
  WALKUP_PAYMENT_TAP_TO_PAY_KIND,
  WALKUP_TAP_TO_PAY_SIGN_IN_AGAIN,
  WALKUP_TAP_TO_PAY_START_ERROR,
} from './constants';
import { parseCreatePaymentTapToPayIntentBody } from './parseCreatePaymentTapToPayIntentBody';
import { paymentRequestsOf } from './paymentRequestsQuery';

export type CreateWalkUpTapToPayIntentResult =
  | {
      ok: true;
      paymentIntentId: string;
      clientSecret: string;
      amountCents: number;
      currency: string;
      terminalLocationId: string;
      stripeAccountId: string;
      merchantDisplayName: string;
    }
  | {
      ok: false;
      httpStatus: number;
      error: string;
      retryAfterSec?: number;
    };

export async function createWalkUpTapToPayIntent(
  request: NextRequest
): Promise<CreateWalkUpTapToPayIntentResult> {
  const auth = await resolveTapToPayRouteAuth(request);
  if (!auth.ok) {
    return {
      ok: false,
      httpStatus: auth.httpStatus,
      error:
        auth.httpStatus === 401 ? WALKUP_TAP_TO_PAY_SIGN_IN_AGAIN : auth.error,
    };
  }

  const rate = await assertOwnerTapToPayIntentRateLimits(request, auth.user.id);
  if (!rate.ok) {
    return {
      ok: false,
      httpStatus: 429,
      error: TAP_TO_PAY_RATE_LIMIT_ERROR,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = parseCreatePaymentTapToPayIntentBody(rawBody);
  if (!parsed.ok) {
    return { ok: false, httpStatus: 400, error: parsed.error };
  }

  const accountResult = await resolveMerchantTapToPayPaymentAccount({
    supabase: auth.supabase,
    businessId: auth.business.id,
  });
  if (!accountResult.ok) {
    return {
      ok: false,
      httpStatus: accountResult.httpStatus,
      error: accountResult.error,
    };
  }

  const stripeAccountResult = resolveMerchantTapToPayStripeAccountId({
    merchantStripeAccountId: accountResult.stripeAccountId,
    requestedStripeAccountId: parsed.body.stripeAccountId,
  });
  if (!stripeAccountResult.ok) {
    return {
      ok: false,
      httpStatus: stripeAccountResult.httpStatus,
      error: stripeAccountResult.error,
    };
  }

  const terminalResult = await ensureTerminalLocation({
    supabase: auth.supabase,
    businessId: auth.business.id,
  });
  if (!terminalResult.ok) {
    return {
      ok: false,
      httpStatus: terminalResult.httpStatus,
      error: walkUpTapToPayUserError(
        terminalResult.error,
        terminalResult.httpStatus
      ),
    };
  }

  if (!terminalResult.terminalLocationId.trim()) {
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  if (terminalResult.stripeAccountId !== stripeAccountResult.stripeAccountId) {
    console.error('[walk-up:tap-to-pay] stripe account mismatch', {
      businessId: auth.business.id,
      merchantAccountId: stripeAccountResult.stripeAccountId,
      terminalAccountId: terminalResult.stripeAccountId,
    });
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  const admin = createSupabaseAdminClient();
  const inserted = await insertWalkUpTapToPayPaymentRequest(admin, {
    businessId: auth.business.id,
    createdBy: auth.user.id,
    amountCents: parsed.body.amountCents,
    currency: parsed.body.currency,
    note: parsed.body.note,
  });
  if (!inserted.ok) {
    return inserted;
  }

  const { paymentRequestId } = inserted;
  const stripe = getStripeConnectClient(stripeAccountResult.stripeAccountId);
  let paymentIntentId = '';
  let clientSecret = '';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsed.body.amountCents,
      currency: parsed.body.currency,
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      description: parsed.body.note,
      metadata: {
        kind: WALKUP_PAYMENT_TAP_TO_PAY_KIND,
        paymentRequestId,
        businessId: auth.business.id,
        note: parsed.body.note,
      },
    });
    paymentIntentId = paymentIntent.id?.trim() ?? '';
    clientSecret = paymentIntent.client_secret?.trim() ?? '';
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe create failed';
    console.error('[walk-up:tap-to-pay] paymentIntents.create failed', message);
    await markWalkUpTapToPayPaymentRequestFailed(admin, paymentRequestId);
    return {
      ok: false,
      httpStatus: 502,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  if (!paymentIntentId || !clientSecret) {
    await markWalkUpTapToPayPaymentRequestFailed(admin, paymentRequestId);
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  const scopeCheck = await verifyTapToPayDirectChargeOnConnectedAccount({
    paymentIntentId,
    stripeAccountId: stripeAccountResult.stripeAccountId,
  });
  if (!scopeCheck.ok) {
    await cancelPaymentIntentBestEffort(stripe, paymentIntentId);
    await markWalkUpTapToPayPaymentRequestFailed(admin, paymentRequestId);
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  const { error: updateError } = await paymentRequestsOf(admin)
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', paymentRequestId);

  if (updateError) {
    console.error('[walk-up:tap-to-pay] store payment intent id failed', {
      paymentRequestId,
      paymentIntentId,
      updateError,
    });
    await cancelPaymentIntentBestEffort(stripe, paymentIntentId);
    await markWalkUpTapToPayPaymentRequestFailed(admin, paymentRequestId);
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  return {
    ok: true,
    paymentIntentId,
    clientSecret,
    amountCents: parsed.body.amountCents,
    currency: parsed.body.currency,
    terminalLocationId: terminalResult.terminalLocationId,
    stripeAccountId: stripeAccountResult.stripeAccountId,
    merchantDisplayName: terminalResult.merchantDisplayName,
  };
}

async function insertWalkUpTapToPayPaymentRequest(
  admin: SupabaseClient<Database>,
  args: {
    businessId: string;
    createdBy: string;
    amountCents: number;
    currency: string;
    note: string;
  }
): Promise<
  | { ok: true; paymentRequestId: string }
  | { ok: false; httpStatus: number; error: string }
> {
  const { data, error } = await paymentRequestsOf(admin)
    .insert({
      business_id: args.businessId,
      created_by: args.createdBy,
      collection_method: WALKUP_PAYMENT_COLLECTION_TAP_TO_PAY,
      status: WALKUP_PAYMENT_STATUS.OPEN,
      amount_cents: args.amountCents,
      currency: args.currency,
      note: args.note,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('[walk-up:tap-to-pay] payment_requests insert failed', error);
    return {
      ok: false,
      httpStatus: 500,
      error: WALKUP_TAP_TO_PAY_START_ERROR,
    };
  }

  return { ok: true, paymentRequestId: data.id as string };
}

function walkUpTapToPayUserError(error: string, httpStatus: number): string {
  if (httpStatus === 422) {
    return error;
  }
  if (error.includes('mark as paid')) {
    return WALKUP_TAP_TO_PAY_START_ERROR;
  }
  return error;
}

async function cancelPaymentIntentBestEffort(
  stripe: { paymentIntents: { cancel: (id: string) => Promise<unknown> } },
  paymentIntentId: string
): Promise<void> {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch {
    // best effort — webhook will settle unused / canceled PIs
  }
}

async function markWalkUpTapToPayPaymentRequestFailed(
  admin: SupabaseClient<Database>,
  paymentRequestId: string
): Promise<void> {
  const { error } = await paymentRequestsOf(admin)
    .update({ status: WALKUP_PAYMENT_STATUS.FAILED })
    .eq('id', paymentRequestId)
    .eq('status', WALKUP_PAYMENT_STATUS.OPEN);
  if (error) {
    console.error('[walk-up:tap-to-pay] mark failed after Stripe error', {
      paymentRequestId,
      error,
    });
  }
}
