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

import {
  bookingCustomerPayloadErrorMessage,
  normalizeBookingCustomerInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { buildBookPageCheckoutReturnUrl } from '@/features/availability/booking/utils/bookingCheckoutReturnUrl';
import { parseBookingCheckoutDraftPayload } from '@/features/availability/booking/utils/parseBookingCheckoutDraftPayload';
import { prefillCustomerWithShopAddress } from '@/features/availability/booking/utils/bookingServiceLocationFlow';
import { clientServiceLocationChoice } from '@/features/availability/booking/utils/resolveBookingServiceLocationType';
import {
  isPetRelatedBusinessType,
  isVehicleRelatedBusinessType,
} from '@/constants/businessTypes';
import { isJobVehicleComplete } from '@/features/availability/booking/utils/visitJobVehicles';
import { isJobPetComplete } from '@/features/availability/booking/utils/visitJobPets';
import { bookingReferralSourceForBusiness } from '@/features/booking-attribution/server/bookingReferralCookie';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import {
  publicBookingPolicyError,
  resolvePublicBookingPolicy,
} from '@/features/business-profile/utils/bookingPolicy';
import {
  buildPublicBookingServiceLocation,
  customerUsesShopAddress,
  resolveEffectiveCustomerServiceLocation,
} from '@/features/business-profile/utils/publicServiceLocation';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { resolveBookingDiscountSnapshot } from '@/features/marketing/server/resolveBookingDiscountSnapshot';
import { promoDiscountResolveErrorMessage } from '@/features/marketing/utils/promoDiscountResolveErrorMessage';
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
    const parsedBookingPayload = parseBookingCheckoutDraftPayload(
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
    if (!parsedBookingPayload) {
      logCheckoutDev('reject: missing or invalid bookingPayload');
      return NextResponse.json(
        { success: false, error: 'Missing booking details.' },
        { status: 400 }
      );
    }
    if (parsedBookingPayload.businessSlug !== businessSlug) {
      logCheckoutDev('reject: bookingPayload slug mismatch', {
        bodySlug: businessSlug,
        payloadSlug: parsedBookingPayload.businessSlug,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid booking context.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_slug, business_name, service_location_mode, service_area, business_zip, shop_street_address, shop_unit, shop_city, shop_state, shop_zip, business_type, booking_policy_enabled, booking_policy_text'
      )
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

    const policyError = publicBookingPolicyError({
      ownerManualBooking: parsedBookingPayload.ownerManualBooking === true,
      agreedToPolicy: parsedBookingPayload.agreedToPolicy === true,
      policyRequired: resolvePublicBookingPolicy(profile) != null,
    });
    if (policyError) {
      return NextResponse.json(
        { success: false, error: policyError },
        { status: 400 }
      );
    }

    const serviceLocation = buildPublicBookingServiceLocation(
      profile as Parameters<typeof buildPublicBookingServiceLocation>[0]
    );
    const locationResolved = resolveEffectiveCustomerServiceLocation(
      serviceLocation.mode,
      clientServiceLocationChoice(parsedBookingPayload)
    );
    if (locationResolved.error || !locationResolved.effective) {
      return NextResponse.json(
        {
          success: false,
          error: locationResolved.error ?? 'Invalid service location',
        },
        { status: 400 }
      );
    }

    if (
      customerUsesShopAddress(
        serviceLocation.mode,
        locationResolved.effective
      ) &&
      !serviceLocation.hasCompleteShopAddress
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'This business has not finished setting up their shop address',
        },
        { status: 400 }
      );
    }

    const requireCustomerAddress = !customerUsesShopAddress(
      serviceLocation.mode,
      locationResolved.effective
    );

    const requireVehicleFields = isVehicleRelatedBusinessType(
      (profile as { business_type?: string | null }).business_type
    );
    const requirePetFields = isPetRelatedBusinessType(
      (profile as { business_type?: string | null }).business_type
    );
    const checkoutJobs = Array.isArray(parsedBookingPayload.jobs)
      ? parsedBookingPayload.jobs
      : null;

    if (requireVehicleFields && checkoutJobs) {
      const incompleteJob = checkoutJobs.findIndex(
        job => !isJobVehicleComplete(job.vehicle ?? {})
      );
      if (incompleteJob >= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Job ${incompleteJob + 1}: vehicle year, make, and model are required`,
          },
          { status: 400 }
        );
      }
    }

    if (requirePetFields && checkoutJobs) {
      const incompleteJob = checkoutJobs.findIndex(
        job => !isJobPetComplete(job.pet ?? {})
      );
      if (incompleteJob >= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Job ${incompleteJob + 1}: pet name, species, breed, and size are required`,
          },
          { status: 400 }
        );
      }
    }

    const customerPayloadErr = bookingCustomerPayloadErrorMessage(
      parsedBookingPayload.customer,
      {
        requireCustomerAddress,
        requireVehicleFields: requireVehicleFields && !checkoutJobs,
        requirePetFields: requirePetFields && !checkoutJobs,
      }
    );
    if (customerPayloadErr) {
      logCheckoutDev('reject: invalid customer payload', {
        error: customerPayloadErr,
      });
      return NextResponse.json(
        { success: false, error: customerPayloadErr },
        { status: 400 }
      );
    }

    let normalizedCustomer = normalizeBookingCustomerInput(
      parsedBookingPayload.customer
    );
    if (!requireCustomerAddress) {
      normalizedCustomer = normalizeBookingCustomerInput(
        prefillCustomerWithShopAddress(normalizedCustomer, serviceLocation)
      );
    }

    const bookingPayload = {
      ...parsedBookingPayload,
      customer: normalizedCustomer,
      customerServiceLocation: locationResolved.effective,
      serviceLocationType: locationResolved.effective,
      referralSource: bookingReferralSourceForBusiness(request, businessSlug),
    };
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

    if (bookingPayload.promoCode) {
      const discountResolved = await resolveBookingDiscountSnapshot(supabase, {
        businessId,
        ownerHasPro,
        serviceDateYmd: bookingPayload.scheduledDate,
        subtotalCents: bookingPayload.totalPriceCents,
        promoCode: bookingPayload.promoCode,
        customerPhone: bookingPayload.customer.phone,
        customerEmail: bookingPayload.customer.email,
      });
      if (!discountResolved.ok) {
        logCheckoutDev('reject: invalid promo code', {
          error: discountResolved.error,
        });
        return NextResponse.json(
          {
            success: false,
            error: promoDiscountResolveErrorMessage(discountResolved.error),
            errorCode: discountResolved.error,
          },
          { status: 400 }
        );
      }
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
