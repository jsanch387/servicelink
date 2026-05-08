/**
 * POST /api/public/booking-checkout
 *
 * Creates a Stripe Checkout Session (payment mode) on the business’s
 * **connected Express account** so the customer can pay deposit or full amount.
 *
 * v1: persists `booking_checkout_sessions` (draft payload + expected amount) before
 * redirect; the booking row is created in the Stripe webhook after payment succeeds.
 *
 * Env: STRIPE_SECRET_KEY
 */

import type { CreateBookingRequest } from '@/features/availability/booking/types';
import { isValidEmail } from '@/features/auth/utils/validation';
import { buildBookPageCheckoutReturnUrl } from '@/features/availability/booking/utils/bookingCheckoutReturnUrl';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const MIN_AMOUNT_CENTS = 50; // Stripe USD minimum
const MAX_AMOUNT_CENTS = 1_000_000; // $10,000 cap (sanity)

/** Debug-only server log (intentionally avoids payload contents). */
function logCheckoutDev(message: string, payload?: Record<string, unknown>) {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NEXT_PUBLIC_DEBUG_BOOKING_CHECKOUT !== 'true'
  ) {
    return;
  }
  void payload;
  console.log('[booking-checkout:api]', message);
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

type BookingCheckoutDraftPayload = CreateBookingRequest & {
  totalPriceCents: number;
  requiredOnlineAmountCents: number;
  paymentMethodSelected: 'pay_now' | 'pay_in_person' | 'none';
  depositType?: 'fixed' | 'percent' | null;
  depositValue?: number | null;
};

function parseBookingCheckoutDraftPayload(
  raw: unknown
): BookingCheckoutDraftPayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const customer = payload.customer as Record<string, unknown> | undefined;
  const serviceName =
    typeof payload.serviceName === 'string' ? payload.serviceName.trim() : '';
  const businessSlug =
    typeof payload.businessSlug === 'string' ? payload.businessSlug.trim() : '';
  const businessId =
    typeof payload.businessId === 'string' ? payload.businessId.trim() : '';
  const scheduledDate =
    typeof payload.scheduledDate === 'string'
      ? payload.scheduledDate.trim()
      : '';
  const startTime =
    typeof payload.startTime === 'string' ? payload.startTime.trim() : '';
  const durationMinutesRaw = payload.durationMinutes;
  const durationMinutes =
    typeof durationMinutesRaw === 'number' &&
    Number.isFinite(durationMinutesRaw)
      ? Math.round(durationMinutesRaw)
      : NaN;
  const fullName =
    typeof customer?.fullName === 'string' ? customer.fullName.trim() : '';
  const email =
    typeof customer?.email === 'string' ? customer.email.trim() : '';
  const totalPriceRaw = payload.totalPriceCents;
  const totalPriceCents =
    typeof totalPriceRaw === 'number' && Number.isFinite(totalPriceRaw)
      ? Math.max(0, Math.round(totalPriceRaw))
      : NaN;
  const requiredOnlineRaw = payload.requiredOnlineAmountCents;
  const requiredOnlineAmountCents =
    typeof requiredOnlineRaw === 'number' && Number.isFinite(requiredOnlineRaw)
      ? Math.max(0, Math.round(requiredOnlineRaw))
      : NaN;
  const paymentMethodSelected = payload.paymentMethodSelected;
  const paymentMethod =
    paymentMethodSelected === 'pay_now' ||
    paymentMethodSelected === 'pay_in_person' ||
    paymentMethodSelected === 'none'
      ? paymentMethodSelected
      : 'none';
  const depositTypeRaw = payload.depositType;
  const depositType =
    depositTypeRaw === 'fixed' || depositTypeRaw === 'percent'
      ? depositTypeRaw
      : null;
  const depositValueRaw = payload.depositValue;
  const depositValue =
    typeof depositValueRaw === 'number' && Number.isFinite(depositValueRaw)
      ? Math.max(0, Math.round(depositValueRaw))
      : null;

  if (
    !businessSlug ||
    !businessId ||
    !serviceName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
    !/^\d{1,2}:\d{2}$/.test(startTime) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 1 ||
    !fullName ||
    !Number.isFinite(totalPriceCents) ||
    !Number.isFinite(requiredOnlineAmountCents)
  ) {
    return null;
  }

  return {
    businessSlug,
    businessId,
    serviceId:
      typeof payload.serviceId === 'string'
        ? payload.serviceId.trim()
        : undefined,
    serviceName,
    servicePriceOptionLabel:
      typeof payload.servicePriceOptionLabel === 'string'
        ? payload.servicePriceOptionLabel.trim()
        : undefined,
    servicePriceCents:
      typeof payload.servicePriceCents === 'number' &&
      Number.isFinite(payload.servicePriceCents)
        ? Math.max(0, Math.round(payload.servicePriceCents))
        : undefined,
    selectedAddOns: Array.isArray(payload.selectedAddOns)
      ? (payload.selectedAddOns as CreateBookingRequest['selectedAddOns'])
      : undefined,
    durationMinutes,
    scheduledDate,
    startTime,
    customer: {
      fullName,
      email,
      phone: typeof customer?.phone === 'string' ? customer.phone : '',
      streetAddress:
        typeof customer?.streetAddress === 'string'
          ? customer.streetAddress
          : '',
      unitApt: typeof customer?.unitApt === 'string' ? customer.unitApt : '',
      city: typeof customer?.city === 'string' ? customer.city : '',
      state: typeof customer?.state === 'string' ? customer.state : '',
      zip: typeof customer?.zip === 'string' ? customer.zip : '',
      vehicleYear:
        typeof customer?.vehicleYear === 'string' ? customer.vehicleYear : '',
      vehicleMake:
        typeof customer?.vehicleMake === 'string' ? customer.vehicleMake : '',
      vehicleModel:
        typeof customer?.vehicleModel === 'string' ? customer.vehicleModel : '',
      notes: typeof customer?.notes === 'string' ? customer.notes : '',
    },
    totalPriceCents,
    requiredOnlineAmountCents,
    paymentMethodSelected: paymentMethod,
    depositType,
    depositValue,
  };
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
    const bookingPayload = parseBookingCheckoutDraftPayload(
      body.bookingPayload
    );
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
    if (!bookingPayload) {
      logCheckoutDev('reject: missing or invalid bookingPayload');
      return NextResponse.json(
        { success: false, error: 'Missing booking details.' },
        { status: 400 }
      );
    }
    const checkoutCustomerEmail = bookingPayload.customer.email.trim();
    if (checkoutCustomerEmail && !isValidEmail(checkoutCustomerEmail)) {
      logCheckoutDev('reject: invalid customer email');
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    if (bookingPayload.businessSlug !== businessSlug) {
      logCheckoutDev('reject: bookingPayload slug mismatch', {
        bodySlug: businessSlug,
        payloadSlug: bookingPayload.businessSlug,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid booking context.' },
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
    if (amountCents !== bookingPayload.requiredOnlineAmountCents) {
      logCheckoutDev('reject: amount mismatch with bookingPayload', {
        amountCents,
        requiredOnlineAmountCents: bookingPayload.requiredOnlineAmountCents,
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

    if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
      logCheckoutDev('reject: business not publicly visible', { businessSlug });
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

    const ownerHasPro = await ownerHasProAccessForBusiness(
      supabase,
      businessId
    );
    if (!ownerHasPro) {
      logCheckoutDev('reject: owner has no pro access', {
        businessId,
        slugForUrl,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Online payments are not available for this business.',
        },
        { status: 403 }
      );
    }

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
    const paymentKind =
      bookingPayload.totalPriceCents > amountCents ? 'deposit' : 'full';
    const { data: checkoutSessionRow, error: checkoutSessionInsertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('booking_checkout_sessions')
        .insert({
          business_id: businessId,
          business_slug: slugForUrl,
          status: 'created',
          payment_kind: paymentKind,
          selected_payment_method: bookingPayload.paymentMethodSelected,
          currency,
          expected_amount_cents: amountCents,
          booking_payload: bookingPayload,
        })
        .select('id')
        .single();
    if (checkoutSessionInsertError || !checkoutSessionRow?.id) {
      console.error(
        '[booking-checkout:api] booking_checkout_sessions insert failed',
        checkoutSessionInsertError
      );
      return NextResponse.json(
        { success: false, error: 'Could not start checkout.' },
        { status: 500 }
      );
    }
    const checkoutSessionRowId = checkoutSessionRow.id as string;

    logCheckoutDev('creating Stripe Checkout Session', {
      currency,
      unit_amount: amountCents,
      stripeAccountPrefix: `${stripeAccountId.slice(0, 12)}…`,
      checkoutSessionRowId,
      paymentKind,
    });

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
            bookingCheckoutSessionId: checkoutSessionRowId,
          },
        },
        { stripeAccount: stripeAccountId }
      );
    } catch (stripeError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('booking_checkout_sessions')
        .update({ status: 'failed' })
        .eq('id', checkoutSessionRowId);
      throw stripeError;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('booking_checkout_sessions')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', checkoutSessionRowId);

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
    console.error('[booking-checkout:api] POST failed', e);
    return NextResponse.json(
      {
        success: false,
        error: userFacingStripeConnectCheckoutError(e),
      },
      { status: 500 }
    );
  }
}
