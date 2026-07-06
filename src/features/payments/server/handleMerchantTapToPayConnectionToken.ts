import { parseTapToPayConnectionTokenBody } from '@/features/availability/booking/server/parseTapToPayConnectionTokenBody';
import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { issueTapToPayConnectionToken } from '@/features/payments/server/issueTapToPayConnectionToken';
import { resolveMerchantTapToPayPaymentAccount } from '@/features/payments/server/resolveMerchantTapToPayPaymentAccount';
import { resolveMerchantTapToPayStripeAccountId } from '@/features/payments/server/resolveMerchantTapToPayStripeAccountId';
import {
  assertOwnerTapToPayConnectionTokenRateLimits,
  TAP_TO_PAY_RATE_LIMIT_ERROR,
} from '@/server/rateLimit/ownerTapToPayRateLimit';
import type { NextRequest } from 'next/server';

export type HandleMerchantTapToPayConnectionTokenResult =
  | { ok: true; secret: string }
  | {
      ok: false;
      httpStatus: number;
      error: string;
      retryAfterSec?: number;
    };

const SIGN_IN_AGAIN = 'Sign in again to collect payment.';

export async function handleMerchantTapToPayConnectionToken(
  request: NextRequest
): Promise<HandleMerchantTapToPayConnectionTokenResult> {
  const auth = await resolveTapToPayRouteAuth(request);
  if (!auth.ok) {
    return {
      ok: false,
      httpStatus: auth.httpStatus,
      error: auth.httpStatus === 401 ? SIGN_IN_AGAIN : auth.error,
    };
  }

  const rate = await assertOwnerTapToPayConnectionTokenRateLimits(
    request,
    auth.user.id
  );
  if (!rate.ok) {
    return {
      ok: false,
      httpStatus: 429,
      error: TAP_TO_PAY_RATE_LIMIT_ERROR,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsedBody = parseTapToPayConnectionTokenBody(rawBody);
  if (!parsedBody.ok) {
    return { ok: false, httpStatus: 400, error: parsedBody.error };
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
    requestedStripeAccountId: parsedBody.body.stripeAccountId,
  });
  if (!stripeAccountResult.ok) {
    return {
      ok: false,
      httpStatus: stripeAccountResult.httpStatus,
      error: stripeAccountResult.error,
    };
  }

  const tokenResult = await issueTapToPayConnectionToken({
    supabase: auth.supabase,
    businessId: auth.business.id,
    stripeAccountId: stripeAccountResult.stripeAccountId,
    logContext: 'tap-to-pay:merchant-connection-token',
  });
  if (!tokenResult.ok) {
    return {
      ok: false,
      httpStatus: tokenResult.httpStatus,
      error: tokenResult.error,
    };
  }

  return { ok: true, secret: tokenResult.secret };
}
