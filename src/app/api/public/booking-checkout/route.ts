/**
 * POST /api/public/booking-checkout
 *
 * Creates a Stripe Checkout Session (payment mode) on the business’s
 * **connected Express account** so the customer can pay deposit or full amount.
 *
 * v1: does not persist booking or session metadata beyond Stripe; used to verify
 * the hosted checkout flow. Amount is validated for sane bounds only.
 *
 * Env: STRIPE_SECRET_KEY
 */

import { buildBookPageCheckoutReturnUrl } from '@/features/availability/booking/utils/bookingCheckoutReturnUrl';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const MIN_AMOUNT_CENTS = 50; // Stripe USD minimum
const MAX_AMOUNT_CENTS = 1_000_000; // $10,000 cap (sanity)

/** Same as client: `NEXT_PUBLIC_DEBUG_BOOKING_CHECKOUT=true` for staging logs. */
function logCheckoutDev(message: string, payload?: Record<string, unknown>) {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NEXT_PUBLIC_DEBUG_BOOKING_CHECKOUT !== 'true'
  ) {
    return;
  }
  if (payload != null) {
    console.log('[booking-checkout:api]', message, payload);
  } else {
    console.log('[booking-checkout:api]', message);
  }
}

function sanitizeLineItemName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  const base = s.length > 0 ? s : 'Booking';
  return base.length > 120 ? `${base.slice(0, 117)}...` : base;
}

function normalizeCurrency(raw: string | null | undefined): string {
  const c = (raw ?? 'usd').trim().toLowerCase();
  return /^[a-z]{3}$/.test(c) ? c : 'usd';
}

export async function POST(request: NextRequest) {
  try {
    logCheckoutDev('POST received');
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      logCheckoutDev('reject: STRIPE_SECRET_KEY missing');
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const businessSlug =
      typeof body.businessSlug === 'string' ? body.businessSlug.trim() : '';
    const resumeQuery =
      typeof body.resumeQuery === 'string' ? body.resumeQuery.trim() : '';
    const amountCentsRaw = body.amountCents;
    const amountCents =
      typeof amountCentsRaw === 'number' && Number.isInteger(amountCentsRaw)
        ? amountCentsRaw
        : typeof amountCentsRaw === 'string' && /^\d+$/.test(amountCentsRaw)
          ? parseInt(amountCentsRaw, 10)
          : NaN;

    if (!businessSlug) {
      logCheckoutDev('reject: missing businessSlug');
      return NextResponse.json(
        { success: false, error: 'Business is required.' },
        { status: 400 }
      );
    }
    if (
      !Number.isFinite(amountCents) ||
      amountCents < MIN_AMOUNT_CENTS ||
      amountCents > MAX_AMOUNT_CENTS
    ) {
      logCheckoutDev('reject: invalid amount', {
        amountCentsRaw,
        parsed: amountCents,
        min: MIN_AMOUNT_CENTS,
        max: MAX_AMOUNT_CENTS,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount.' },
        { status: 400 }
      );
    }
    logCheckoutDev('request ok', { businessSlug, amountCents });

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_slug, business_name')
      .eq('business_slug', businessSlug)
      .single();

    if (profileError || !profile) {
      logCheckoutDev('reject: business not found', {
        businessSlug,
        profileError: profileError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Business not found.' },
        { status: 404 }
      );
    }

    const businessId = (profile as { id: string }).id;
    const slugForUrl =
      (profile as { business_slug: string | null }).business_slug?.trim() ||
      businessSlug;
    logCheckoutDev('business resolved', { businessId, slugForUrl });
    const businessDisplayName =
      (profile as { business_name: string | null }).business_name?.trim() ||
      slugForUrl;

    const { data: settingsRow, error: settingsError } = await paymentSettingsOf(
      supabase
    )
      .select('payments_enabled, currency')
      .eq('business_id', businessId)
      .maybeSingle();

    if (settingsError) {
      console.error('booking-checkout payment_settings', settingsError);
      return NextResponse.json(
        { success: false, error: 'Could not load payment settings.' },
        { status: 500 }
      );
    }

    if (!settingsRow || settingsRow.payments_enabled !== true) {
      logCheckoutDev('reject: payments not enabled', {
        businessId,
        hasRow: Boolean(settingsRow),
        payments_enabled: settingsRow?.payments_enabled,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Online payments are not enabled for this business.',
        },
        { status: 400 }
      );
    }

    const currency = normalizeCurrency(
      (settingsRow as { currency?: string | null }).currency
    );

    const { data: accountRow, error: accountError } = await paymentAccountsOf(
      supabase
    )
      .select('stripe_account_id, charges_enabled')
      .eq('business_id', businessId)
      .maybeSingle();

    if (accountError) {
      console.error('booking-checkout payment_accounts', accountError);
      return NextResponse.json(
        { success: false, error: 'Could not load payment account.' },
        { status: 500 }
      );
    }

    const stripeAccountId = (
      accountRow as { stripe_account_id?: string } | null
    )?.stripe_account_id?.trim();
    const chargesEnabled =
      (accountRow as { charges_enabled?: boolean } | null)?.charges_enabled ===
      true;

    if (!stripeAccountId || !chargesEnabled) {
      logCheckoutDev('reject: stripe account not ready', {
        businessId,
        hasAccountId: Boolean(stripeAccountId),
        chargesEnabled,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            'This business cannot accept card payments yet. Finish Stripe setup first.',
        },
        { status: 400 }
      );
    }

    const baseUrl = getAppBaseUrl(request);
    const lineName = sanitizeLineItemName(body.serviceName);
    const stripe = getStripePlatform();

    logCheckoutDev('creating Stripe Checkout Session', {
      currency,
      unit_amount: amountCents,
      stripeAccountPrefix: `${stripeAccountId.slice(0, 12)}…`,
    });

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: lineName,
                description: `Payment to ${businessDisplayName}`,
              },
            },
          },
        ],
        success_url: buildBookPageCheckoutReturnUrl({
          baseUrl,
          businessSlug: slugForUrl,
          checkout: 'success',
          resumeQuery: resumeQuery || undefined,
        }),
        cancel_url: buildBookPageCheckoutReturnUrl({
          baseUrl,
          businessSlug: slugForUrl,
          checkout: 'cancel',
          resumeQuery: resumeQuery || undefined,
        }),
        metadata: {
          businessId,
          businessSlug: slugForUrl,
          kind: 'booking_checkout',
        },
      },
      { stripeAccount: stripeAccountId }
    );

    if (!session.url) {
      logCheckoutDev('reject: session created but no url', {
        sessionId: session.id,
      });
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a checkout URL.' },
        { status: 502 }
      );
    }

    logCheckoutDev('success', {
      sessionId: session.id,
      urlHost: (() => {
        try {
          return new URL(session.url).host;
        } catch {
          return null;
        }
      })(),
    });
    return NextResponse.json({ success: true, url: session.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Could not start checkout.';
    console.error('[booking-checkout:api] POST failed', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
