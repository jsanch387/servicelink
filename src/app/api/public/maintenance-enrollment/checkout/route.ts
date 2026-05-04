/**
 * POST /api/public/maintenance-enrollment/checkout
 *
 * Starts Stripe Checkout for a maintenance enrollment (full visit price).
 * Customer must pass the same magic token as in their email link.
 */

import {
  checkMaintenanceAnchorAgainstCalendar,
  maintenanceSlotAvailabilityUserMessage,
} from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { loadPublicMaintenanceEnrollmentByToken } from '@/features/maintenance/server/loadPublicMaintenanceEnrollment';
import {
  maintenanceCustomerPaymentOptions,
  type MaintenanceLivePaymentFlags,
} from '@/features/maintenance/server/maintenancePaymentEligibility';
import { maintenanceDetailServiceLabel } from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const MIN_AMOUNT_CENTS = 50;
const MAX_AMOUNT_CENTS = 1_000_000;

function normalizeCurrency(raw: string | null | undefined): string {
  const c = (raw ?? 'usd').trim().toLowerCase();
  return /^[a-z]{3}$/.test(c) ? c : 'usd';
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { token?: string };
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Link is required.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const enrollment = await loadPublicMaintenanceEnrollmentByToken(
      db,
      rawToken
    );
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'This link is invalid.' },
        { status: 404 }
      );
    }

    if (!hasMaintenanceAnchorScheduled(enrollment)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Choose your first visit date and time on this page before paying with card.',
        },
        { status: 400 }
      );
    }

    if (enrollment.status !== 'enrolled_pending_customer') {
      return NextResponse.json(
        {
          success: false,
          error: 'This enrollment has already been completed.',
        },
        { status: 409 }
      );
    }

    if (enrollment.payment_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Payment has already been recorded.' },
        { status: 409 }
      );
    }

    const priceCents = Math.max(
      0,
      Math.round(Number(enrollment.price_cents ?? 0))
    );
    if (priceCents < MIN_AMOUNT_CENTS || priceCents > MAX_AMOUNT_CENTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment amount for this maintenance detail.',
        },
        { status: 400 }
      );
    }

    const businessId = enrollment.business_id;

    const ownerHasPro = await ownerHasProAccessForBusiness(
      supabase,
      businessId
    );

    const { data: settingsRow, error: settingsError } = await paymentSettingsOf(
      supabase
    )
      .select('payments_enabled, currency, checkout_mode')
      .eq('business_id', businessId)
      .maybeSingle();

    if (settingsError) {
      console.error('[maintenance-checkout] payment_settings', settingsError);
      return NextResponse.json(
        { success: false, error: 'Could not load payment settings.' },
        { status: 500 }
      );
    }

    const paymentsEnabled =
      (settingsRow as { payments_enabled?: boolean } | null)
        ?.payments_enabled === true;
    const checkoutMode = checkoutModeFromDb(
      (settingsRow as { checkout_mode?: string | null } | null)?.checkout_mode
    );

    const { data: accountRow, error: accountError } = await paymentAccountsOf(
      supabase
    )
      .select('stripe_account_id, charges_enabled')
      .eq('business_id', businessId)
      .maybeSingle();

    if (accountError) {
      console.error('[maintenance-checkout] payment_accounts', accountError);
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

    if (!stripeAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'This business cannot accept card payments yet.',
        },
        { status: 400 }
      );
    }

    const liveFlags: MaintenanceLivePaymentFlags = {
      checkoutMode,
      paymentsEnabled,
      chargesEnabled,
      ownerHasProForPayments: ownerHasPro,
    };

    const { showPayWithCard } = maintenanceCustomerPaymentOptions(liveFlags);
    if (!showPayWithCard) {
      return NextResponse.json(
        {
          success: false,
          error: 'Card payment is not available for this business.',
        },
        { status: 403 }
      );
    }

    const durationMinutes = Math.max(
      1,
      Math.round(Number(enrollment.duration_minutes ?? 60))
    );
    const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
      businessId,
      anchorDate: String(enrollment.anchor_date ?? '').trim(),
      anchorTime: String(enrollment.anchor_time ?? ''),
      durationMinutes,
    });
    if (!slotCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: maintenanceSlotAvailabilityUserMessage(slotCheck.reason),
        },
        { status: 409 }
      );
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle();

    if (profileError) {
      console.error('[maintenance-checkout] business_profiles', profileError);
      return NextResponse.json(
        { success: false, error: 'Could not load business.' },
        { status: 500 }
      );
    }

    const businessDisplayName =
      (
        profileRow as { business_name?: string | null } | null
      )?.business_name?.trim() || 'Your detailer';

    const currency = normalizeCurrency(
      (settingsRow as { currency?: string | null } | null)?.currency
    );

    const baseUrl = getAppBaseUrl(request);
    const successUrl = `${baseUrl}/maintenance/e/${encodeURIComponent(rawToken)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/maintenance/e/${encodeURIComponent(rawToken)}?checkout=cancel`;

    const stripe = getStripePlatform();
    const lineItemName = maintenanceDetailServiceLabel(
      enrollment.service_name_snapshot
    ).slice(0, 120);

    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: priceCents,
                product_data: {
                  name: lineItemName,
                  description: businessDisplayName.slice(0, 500),
                },
              },
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            kind: 'maintenance_enrollment',
            maintenanceEnrollmentId: enrollment.id,
            expectedAmountCents: String(priceCents),
          },
        },
        { stripeAccount: stripeAccountId }
      );
    } catch (stripeErr) {
      console.error(
        '[maintenance-checkout] Stripe session create failed',
        stripeErr
      );
      return NextResponse.json(
        {
          success: false,
          error: userFacingStripeConnectCheckoutError(stripeErr),
        },
        { status: 502 }
      );
    }

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a checkout URL.' },
        { status: 502 }
      );
    }

    const { error: updateError } = await db
      .from('maintenance_enrollments')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error(
        '[maintenance-checkout] failed to persist stripe_checkout_session_id',
        updateError
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Could not start checkout.';
    console.error('[maintenance-checkout] POST failed', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
