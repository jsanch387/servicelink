/**
 * POST /api/stripe/connect/onboard
 *
 * Opens Stripe-hosted Connect Express onboarding; persists `payment_accounts`
 * on first connect and reuses `stripe_account_id` afterward (new Account Link).
 *
 * Auth: Supabase cookies (web) or `Authorization: Bearer <access_token>` (mobile).
 * Mobile: JSON `{ "client": "mobile" }` and env return/refresh URLs (see Stripe README).
 */

import { logConnect } from '@/features/payments/server/connectOnboardingLog';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { startExpressConnectOnboarding } from '@/features/payments/stripe';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { validateConnectAccountLinkUrl } from '@/libs/stripe/validateConnectAccountLinkUrl';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

type OnboardRequestBody = {
  client?: unknown;
};

const LOG = '[stripe:connect-onboard]';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      logConnect('onboard.abort', { reason: 'missing_stripe_secret' });
      return NextResponse.json(
        {
          success: false,
          error:
            'Stripe is not configured (missing STRIPE_SECRET_KEY). Add it to your environment.',
        },
        { status: 500 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      console.warn(`${LOG} auth failed`, {
        status: auth.status,
        code: auth.code,
        message: auth.error,
      });
      logConnect('onboard.abort', { reason: 'unauthenticated' });
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    const hasPro = await getHasProAccessForPayments(supabase, user.id);
    if (!hasPro) {
      logConnect('onboard.abort', {
        reason: 'not_pro',
        userId: user.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Pro subscription required to connect payments',
        },
        { status: 403 }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(supabase);
    if (!businessResolved.ok) {
      logConnect('onboard.abort', {
        reason: 'no_business',
        userId: user.id,
        httpStatus: businessResolved.status,
      });
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const body = (await request.json().catch(() => ({}))) as OnboardRequestBody;
    const isMobileClient = body.client === 'mobile';

    let accountLinkUrls: { returnUrl: string; refreshUrl: string } | undefined;
    if (isMobileClient) {
      const mobileReturn =
        process.env.STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL?.trim();
      const mobileRefresh =
        process.env.STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL?.trim();
      if (!mobileReturn || !mobileRefresh) {
        console.error(`${LOG} mobile Connect return URLs missing`, {
          STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL: Boolean(mobileReturn)
            ? '(set)'
            : '(missing)',
          STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL: Boolean(mobileRefresh)
            ? '(set)'
            : '(missing)',
          hint: 'Add both to .env.local and restart next dev',
        });
        return NextResponse.json(
          {
            success: false,
            error:
              'Mobile Connect onboarding is not configured. Set STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL and STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL.',
          },
          { status: 500 }
        );
      }
      const returnParsed = validateConnectAccountLinkUrl(
        mobileReturn,
        'STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL'
      );
      const refreshParsed = validateConnectAccountLinkUrl(
        mobileRefresh,
        'STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL'
      );
      if (!returnParsed.ok || !refreshParsed.ok) {
        const detail = !returnParsed.ok
          ? returnParsed.message
          : !refreshParsed.ok
            ? refreshParsed.message
            : '';
        console.error(`${LOG} mobile Connect URLs invalid for Stripe`, {
          hint: 'Use https://… (or http://localhost… in dev). Custom schemes like myapp:// are rejected.',
        });
        return NextResponse.json(
          {
            success: false,
            error: `Invalid Connect redirect URL: ${detail}`,
          },
          { status: 500 }
        );
      }
      accountLinkUrls = {
        returnUrl: returnParsed.href,
        refreshUrl: refreshParsed.href,
      };
    }

    const { data: existingRow } = await paymentAccountsOf(supabase)
      .select('stripe_account_id')
      .eq('business_id', businessResolved.businessId)
      .maybeSingle();

    const existingStripeAccountId =
      existingRow?.stripe_account_id?.trim() || null;

    logConnect('onboard.start', {
      userId: user.id,
      businessId: businessResolved.businessId,
      mode: existingStripeAccountId ? 'resume_link' : 'new_stripe_account',
      existingStripeAccountId: existingStripeAccountId ?? undefined,
    });

    const result = await startExpressConnectOnboarding({
      request,
      user: { id: user.id, email: user.email ?? undefined },
      businessId: businessResolved.businessId,
      existingStripeAccountId: existingStripeAccountId || undefined,
      accountLinkUrls,
    });

    if (result.createdNewStripeAccount) {
      const { error: upsertError } = await paymentAccountsOf(supabase).upsert(
        {
          business_id: businessResolved.businessId,
          provider: 'stripe',
          stripe_account_id: result.stripeAccountId,
          onboarding_status: 'in_progress',
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        },
        { onConflict: 'business_id' }
      );

      if (upsertError) {
        logConnect('onboard.payment_accounts_upsert_failed', {
          businessId: businessResolved.businessId,
          stripeAccountId: result.stripeAccountId,
          message: upsertError.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to save payment account' },
          { status: 500 }
        );
      }
      logConnect('onboard.payment_accounts_upsert_ok', {
        businessId: businessResolved.businessId,
        stripeAccountId: result.stripeAccountId,
        onboarding_status: 'in_progress',
      });
    }

    logConnect('onboard.success', {
      businessId: businessResolved.businessId,
      stripeAccountId: result.stripeAccountId,
      createdNewStripeAccount: result.createdNewStripeAccount,
      accountLinkIssued: true,
    });

    return NextResponse.json({ success: true, url: result.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    logConnect('onboard.error', { message });
    console.error(`${LOG} error`, e);
    const stripeCode =
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      typeof (e as { code?: unknown }).code === 'string'
        ? (e as { code: string }).code
        : null;
    if (stripeCode === 'url_invalid') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stripe rejected the Connect return or refresh URL. Use full http(s) URLs in STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL and STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL — not custom app schemes (use an https bridge that opens the app).',
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to start Stripe onboarding' },
      { status: 500 }
    );
  }
}
