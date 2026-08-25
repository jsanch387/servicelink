import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertOwnerWalkUpPaymentLinkRateLimits,
  WALKUP_PAYMENT_LINK_RATE_LIMIT_ERROR,
} from '@/server/rateLimit/ownerWalkUpPaymentLinkRateLimit';
import type { NextRequest } from 'next/server';
import {
  WALKUP_PAYMENT_COLLECTION_CHECKOUT_LINK,
  WALKUP_PAYMENT_LINK_KIND,
  WALKUP_PAYMENT_STATUS,
} from './constants';
import { generatePaymentRequestShortCode } from './generatePaymentRequestShortCode';
import { parseCreatePaymentLinkBody } from './parseCreatePaymentLinkBody';
import { paymentRequestsOf } from './paymentRequestsQuery';
import { resolveMerchantWalkUpPaymentAccount } from './resolveMerchantWalkUpPaymentAccount';
import {
  buildPublicPaymentLinkUrl,
  buildWalkUpPaymentCompleteUrl,
} from './walkUpPaymentLinkUrls';

export type CreateWalkUpPaymentLinkResult =
  | {
      ok: true;
      url: string;
      paymentLinkId: string;
      paymentRequestId: string;
    }
  | {
      ok: false;
      httpStatus: number;
      error: string;
      retryAfterSec?: number;
    };

const SIGN_IN_AGAIN = 'Sign in again to create a payment link.';

export async function createWalkUpPaymentLink(
  request: NextRequest
): Promise<CreateWalkUpPaymentLinkResult> {
  const auth = await resolveTapToPayRouteAuth(request);
  if (!auth.ok) {
    return {
      ok: false,
      httpStatus: auth.httpStatus,
      error: auth.httpStatus === 401 ? SIGN_IN_AGAIN : auth.error,
    };
  }

  const rate = await assertOwnerWalkUpPaymentLinkRateLimits(
    request,
    auth.user.id
  );
  if (!rate.ok) {
    return {
      ok: false,
      httpStatus: 429,
      error: WALKUP_PAYMENT_LINK_RATE_LIMIT_ERROR,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = parseCreatePaymentLinkBody(rawBody);
  if (!parsed.ok) {
    return { ok: false, httpStatus: 400, error: parsed.error };
  }

  const accountResult = await resolveMerchantWalkUpPaymentAccount({
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

  const admin = createSupabaseAdminClient();
  const inserted = await insertPaymentRequestWithShortCode(admin, {
    businessId: auth.business.id,
    createdBy: auth.user.id,
    amountCents: parsed.body.amountCents,
    currency: parsed.body.currency,
    note: parsed.body.note,
  });
  if (!inserted.ok) {
    return inserted;
  }

  const { paymentRequestId, shortCode } = inserted;
  const businessDisplayName =
    auth.business.business_name?.trim() || 'your business';
  const baseUrl = getAppBaseUrl(request);
  const stripe = getStripePlatform();

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: parsed.body.currency,
              unit_amount: parsed.body.amountCents,
              product_data: {
                name: parsed.body.note,
                description: `Payment to ${businessDisplayName}`,
              },
            },
          },
        ],
        success_url: buildWalkUpPaymentCompleteUrl({
          baseUrl,
        }),
        cancel_url: buildPublicPaymentLinkUrl({ baseUrl, shortCode }),
        payment_intent_data: {
          description: parsed.body.note,
          metadata: {
            kind: WALKUP_PAYMENT_LINK_KIND,
            paymentRequestId,
            businessId: auth.business.id,
          },
        },
        metadata: {
          kind: WALKUP_PAYMENT_LINK_KIND,
          paymentRequestId,
          businessId: auth.business.id,
        },
      },
      { stripeAccount: accountResult.stripeAccountId }
    );

    if (!session.url) {
      await paymentRequestsOf(admin)
        .update({ status: WALKUP_PAYMENT_STATUS.FAILED })
        .eq('id', paymentRequestId);
      return {
        ok: false,
        httpStatus: 502,
        error: 'Stripe did not return a checkout URL.',
      };
    }

    const { error: updateError } = await paymentRequestsOf(admin)
      .update({
        stripe_checkout_session_id: session.id,
        stripe_checkout_url: session.url,
      })
      .eq('id', paymentRequestId);
    if (updateError) {
      console.error(
        '[walk-up:payment-link] store checkout session id failed',
        updateError
      );
    }

    return {
      ok: true,
      url: buildPublicPaymentLinkUrl({ baseUrl, shortCode }),
      paymentLinkId: session.id,
      paymentRequestId,
    };
  } catch (error) {
    console.error(
      '[walk-up:payment-link] checkout.sessions.create failed',
      error
    );
    await paymentRequestsOf(admin)
      .update({ status: WALKUP_PAYMENT_STATUS.FAILED })
      .eq('id', paymentRequestId);
    return {
      ok: false,
      httpStatus: 500,
      error: userFacingStripeConnectCheckoutError(error),
    };
  }
}

const SHORT_CODE_INSERT_ATTEMPTS = 6;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

async function insertPaymentRequestWithShortCode(
  admin: SupabaseClient<Database>,
  args: {
    businessId: string;
    createdBy: string;
    amountCents: number;
    currency: string;
    note: string;
  }
): Promise<
  | { ok: true; paymentRequestId: string; shortCode: string }
  | { ok: false; httpStatus: number; error: string }
> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < SHORT_CODE_INSERT_ATTEMPTS; attempt++) {
    const shortCode = generatePaymentRequestShortCode();
    const { data, error } = await paymentRequestsOf(admin)
      .insert({
        business_id: args.businessId,
        created_by: args.createdBy,
        collection_method: WALKUP_PAYMENT_COLLECTION_CHECKOUT_LINK,
        status: WALKUP_PAYMENT_STATUS.OPEN,
        amount_cents: args.amountCents,
        currency: args.currency,
        note: args.note,
        short_code: shortCode,
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      return { ok: true, paymentRequestId: data.id as string, shortCode };
    }

    lastError = error;
    const msg =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : '';
    const shortCodeClash =
      isUniqueViolation(error) &&
      (msg.includes('short_code') ||
        msg.includes('payment_requests_short_code'));
    if (!shortCodeClash) {
      break;
    }
  }

  console.error('[walk-up:payment-link] payment_requests insert failed', {
    lastError,
  });
  return {
    ok: false,
    httpStatus: 500,
    error: 'Could not create a payment link.',
  };
}
