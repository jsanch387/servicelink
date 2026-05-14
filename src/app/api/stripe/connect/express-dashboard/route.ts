/**
 * POST /api/stripe/connect/express-dashboard
 *
 * Returns a short-lived Stripe **Express Dashboard** URL for the current
 * business’s connected account (`acct_…`). The owner must be signed in, on
 * Pro, and linked to that account via `payment_accounts`.
 *
 * Auth: Supabase cookies (web) or `Authorization: Bearer <access_token>` (mobile).
 * Optional JSON `{ "client": "mobile" }` for parity with other Stripe routes; the
 * Stripe Login Link has no configurable return URL — open `url` in an in-app
 * browser and return to your app when the user dismisses it.
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[stripe:connect-express-dashboard]';

type ExpressDashboardBody = {
  client?: unknown;
};

function shortUuidPrefix(id: string): string {
  const t = id.trim();
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

/** Log correlation only — never log full `acct_…` or login URLs. */
function stripeAccountPrefixForLog(acct: string): string {
  const t = acct.trim();
  if (!t) return '?';
  if (t.length <= 10) return t;
  return `${t.slice(0, 10)}…`;
}

function truncateDetail(message: string, max = 160): string {
  const m = message.trim();
  if (!m) return '';
  return m.length <= max ? m : `${m.slice(0, max)}…`;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      console.error(`${LOG} missing STRIPE_SECRET_KEY`);
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).',
        },
        { status: 500 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      console.warn(`${LOG} auth_failed`, {
        status: auth.status,
        code: auth.code,
        message: auth.error,
      });
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const { user, supabase, authMethod } = auth;

    const body = (await request

      .json()
      .catch(() => ({}))) as ExpressDashboardBody;
    const mobileClient = body.client === 'mobile';

    const hasPro = await getHasProAccessForPayments(supabase, user.id);
    if (!hasPro) {
      console.warn(`${LOG} not_pro`, { authMethod });
      return NextResponse.json(
        { success: false, error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(supabase);
    if (!businessResolved.ok) {
      console.warn(`${LOG} business_resolve_failed`, {
        authMethod,
        httpStatus: businessResolved.status,
      });
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const businessId = businessResolved.businessId;

    const { data: row, error: rowError } = await paymentAccountsOf(supabase)
      .select('stripe_account_id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (rowError) {
      console.error(`${LOG} payment_accounts_query_failed`, {
        authMethod,
        businessId: shortUuidPrefix(businessId),
        detail: truncateDetail(rowError.message),
      });
      return NextResponse.json(
        { success: false, error: rowError.message },
        { status: 500 }
      );
    }

    const stripeAccountId = row?.stripe_account_id?.trim();
    if (!stripeAccountId) {
      console.warn(`${LOG} no_connected_account`, {
        authMethod,
        businessId: shortUuidPrefix(businessId),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'No Stripe account linked for this business yet.',
        },
        { status: 404 }
      );
    }

    const stripe = getStripePlatform();
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    if (!loginLink?.url) {
      console.error(`${LOG} stripe_no_login_url`, {
        authMethod,
        stripeAccount: stripeAccountPrefixForLog(stripeAccountId),
      });
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a dashboard link.' },
        { status: 502 }
      );
    }

    console.info(`${LOG} login_link_ok`, {
      authMethod,
      client: mobileClient ? 'mobile' : 'web',
      businessId: shortUuidPrefix(businessId),
      stripeAccount: stripeAccountPrefixForLog(stripeAccountId),
    });

    return NextResponse.json({ success: true, url: loginLink.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Could not open Stripe dashboard.';
    console.error(
      `${LOG} unhandled_exception`,
      { message: truncateDetail(message, 200) },
      e
    );
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
