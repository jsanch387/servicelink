/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint. Verifies signature, ensures idempotency, then
 * updates the database (e.g. set user to Pro after checkout.session.completed).
 *
 * Env: STRIPE_WEBHOOK_SECRET (whsec_... from Stripe Dashboard → Webhooks).
 * Requires stripe_webhook_events table for idempotency (see README).
 *
 * ---
 * **Logging & privacy**
 *
 * `console.error` / `console.warn` here run **only on the server** (terminal, Vercel
 * logs, your log drain). They are **not** sent to visitors’ browsers. The **Stripe
 * webhook is called by Stripe’s servers**, not by your customers, so it does not show
 * up in a normal user’s Network tab when they use your app.
 *
 * Prefer logging **Stripe `event.id` (`evt_…`)** for support correlation. Avoid logging
 * secrets (signing keys, raw webhook body, payment method details). Keep **HTTP
 * responses** generic (`{ error: '…' }`) so any 4xx/5xx body that Stripe (or a proxy)
 * might record does not leak internal DB messages.
 */

import type { CustomerFormData } from '@/features/availability/booking/types';
import { createBooking } from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  sendTrialEndingSoonEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { buildAvailabilityBookingEmailServiceLocation } from '@/features/email/availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';
import { buildStripeCheckoutPaymentSummary } from '@/features/email/availability-booking-notification/buildAvailabilityBookingPaymentSummary';
import {
  buildPublicBookingServiceLocation,
  resolveEffectiveCustomerServiceLocation,
} from '@/features/business-profile/utils/publicServiceLocation';
import {
  clientServiceLocationChoice,
  resolvePersistedBookingServiceLocationType,
} from '@/features/availability/booking/utils/resolveBookingServiceLocationType';
import { ensureMaintenanceEnrollmentInitialBooking } from '@/features/maintenance/server/ensureMaintenanceEnrollmentInitialBooking';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import { sendMaintenanceEnrollmentConfirmedIfApplicable } from '@/features/maintenance/server/sendMaintenanceEnrollmentConfirmedIfApplicable';
import { downgradeProfileFromSubscriptionEnd } from '@/features/pricing/server/downgradeProfileFromSubscriptionEnd';
import { subscriptionCurrentPeriodEndUnix } from '@/features/pricing/server/stripeSubscriptionPeriodEnd';
import { notifyPaymentFailedOnce } from '@/features/pricing/server/notifyPaymentFailedOnce';
import { sendProWelcomeIfFirstPaidPro } from '@/features/pricing/server/sendProWelcomeIfFirstPaidPro';
import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { applyPlatformProCheckoutSessionCompleted } from '@/features/pricing/server/trialConfirmationPayload';
import { subscriptionIsScheduledCancelWithoutRenewal } from '@/features/pricing/utils/subscriptionScheduledCancel';
import { getStripePlatform } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function logBookingWebhook(message: string, payload?: Record<string, unknown>) {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NEXT_PUBLIC_DEBUG_BOOKING_CHECKOUT !== 'true'
  ) {
    return;
  }
  void payload;
  console.log('[booking-checkout:webhook]', message);
}

/**
 * Minimal server-side trace logs for Stripe booking checkout flow.
 * Logs only operational IDs/status (no customer PII, no payment method details).
 */
function logBookingCheckoutStage(
  stage: string,
  details?: {
    eventId?: string;
    sessionId?: string;
    checkoutSessionRowId?: string;
    bookingId?: string;
    paymentStatus?: string;
  }
) {
  console.info('[booking-checkout:stage]', stage, details ?? {});
}

/** Email collected on Stripe Checkout when the booking form left it blank. */
function stripeCheckoutCollectedEmail(
  session: Stripe.Checkout.Session
): string {
  const direct =
    typeof session.customer_email === 'string'
      ? session.customer_email.trim()
      : '';
  if (direct.length > 0) return direct;
  const fromDetails = session.customer_details?.email;
  return typeof fromDetails === 'string' ? fromDetails.trim() : '';
}

type StoredBookingCheckoutPayload = {
  businessId: string;
  businessSlug: string;
  serviceId?: string;
  serviceName: string;
  servicePriceOptionLabel?: string;
  servicePriceCents?: number;
  selectedAddOns?: Array<{
    id: string;
    name: string;
    priceCents: number;
    durationMinutes?: number | null;
  }>;
  durationMinutes: number;
  scheduledDate: string;
  startTime: string;
  customer: {
    fullName: string;
    email: string;
    phone?: string;
    streetAddress?: string;
    unitApt?: string;
    city?: string;
    state?: string;
    zip?: string;
    vehicleYear?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    notes?: string;
  };
  totalPriceCents: number;
  requiredOnlineAmountCents: number;
  paymentMethodSelected: 'pay_now' | 'pay_in_person' | 'none';
  depositType?: 'fixed' | 'percent' | null;
  depositValue?: number | null;
  customerServiceLocation?: 'mobile' | 'shop';
  serviceLocationType?: 'mobile' | 'shop';
};

function customerFormFromCheckoutStored(
  c: StoredBookingCheckoutPayload['customer']
): CustomerFormData {
  return {
    fullName: c.fullName,
    email: c.email,
    phone: typeof c.phone === 'string' ? c.phone : '',
    streetAddress: typeof c.streetAddress === 'string' ? c.streetAddress : '',
    unitApt: typeof c.unitApt === 'string' ? c.unitApt : '',
    city: typeof c.city === 'string' ? c.city : '',
    state: typeof c.state === 'string' ? c.state : '',
    zip: typeof c.zip === 'string' ? c.zip : '',
    vehicleYear: typeof c.vehicleYear === 'string' ? c.vehicleYear : '',
    vehicleMake: typeof c.vehicleMake === 'string' ? c.vehicleMake : '',
    vehicleModel: typeof c.vehicleModel === 'string' ? c.vehicleModel : '',
    notes: typeof c.notes === 'string' ? c.notes : '',
  };
}

function parseStoredBookingCheckoutPayload(
  raw: unknown
): StoredBookingCheckoutPayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const customer = p.customer as Record<string, unknown> | undefined;
  const businessId =
    typeof p.businessId === 'string' ? p.businessId.trim() : '';
  const businessSlug =
    typeof p.businessSlug === 'string' ? p.businessSlug.trim() : '';
  const serviceName =
    typeof p.serviceName === 'string' ? p.serviceName.trim() : '';
  const scheduledDate =
    typeof p.scheduledDate === 'string' ? p.scheduledDate.trim() : '';
  const startTime = typeof p.startTime === 'string' ? p.startTime.trim() : '';
  const durationMinutesRaw = p.durationMinutes;
  const durationMinutes =
    typeof durationMinutesRaw === 'number' &&
    Number.isFinite(durationMinutesRaw)
      ? Math.round(durationMinutesRaw)
      : NaN;
  const fullName =
    typeof customer?.fullName === 'string' ? customer.fullName.trim() : '';
  const email =
    typeof customer?.email === 'string' ? customer.email.trim() : '';
  const totalPriceRaw = p.totalPriceCents;
  const totalPriceCents =
    typeof totalPriceRaw === 'number' && Number.isFinite(totalPriceRaw)
      ? Math.max(0, Math.round(totalPriceRaw))
      : NaN;
  const requiredRaw = p.requiredOnlineAmountCents;
  const requiredOnlineAmountCents =
    typeof requiredRaw === 'number' && Number.isFinite(requiredRaw)
      ? Math.max(0, Math.round(requiredRaw))
      : NaN;
  const paymentMethodSelected = p.paymentMethodSelected;
  const method =
    paymentMethodSelected === 'pay_now' ||
    paymentMethodSelected === 'pay_in_person' ||
    paymentMethodSelected === 'none'
      ? paymentMethodSelected
      : null;
  const customerServiceLocationRaw = p.customerServiceLocation;
  const customerServiceLocation =
    customerServiceLocationRaw === 'mobile' ||
    customerServiceLocationRaw === 'shop'
      ? customerServiceLocationRaw
      : undefined;
  const serviceLocationTypeRaw = p.serviceLocationType;
  const serviceLocationType =
    serviceLocationTypeRaw === 'mobile' || serviceLocationTypeRaw === 'shop'
      ? serviceLocationTypeRaw
      : undefined;
  if (
    !businessId ||
    !businessSlug ||
    !serviceName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
    !/^\d{1,2}:\d{2}$/.test(startTime) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 1 ||
    !fullName ||
    !Number.isFinite(totalPriceCents) ||
    !Number.isFinite(requiredOnlineAmountCents) ||
    !method
  ) {
    return null;
  }
  return {
    businessId,
    businessSlug,
    serviceId: typeof p.serviceId === 'string' ? p.serviceId.trim() : undefined,
    serviceName,
    servicePriceOptionLabel:
      typeof p.servicePriceOptionLabel === 'string'
        ? p.servicePriceOptionLabel.trim()
        : undefined,
    servicePriceCents:
      typeof p.servicePriceCents === 'number' &&
      Number.isFinite(p.servicePriceCents)
        ? Math.max(0, Math.round(p.servicePriceCents))
        : undefined,
    selectedAddOns: Array.isArray(p.selectedAddOns)
      ? (p.selectedAddOns as StoredBookingCheckoutPayload['selectedAddOns'])
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
    paymentMethodSelected: method,
    depositType:
      p.depositType === 'fixed' || p.depositType === 'percent'
        ? p.depositType
        : null,
    depositValue:
      typeof p.depositValue === 'number' && Number.isFinite(p.depositValue)
        ? Math.max(0, Math.round(p.depositValue))
        : null,
    customerServiceLocation,
    serviceLocationType,
  };
}

export async function POST(request: NextRequest) {
  const isConnectWebhookPath = request.nextUrl.pathname.endsWith(
    '/api/stripe/webhook-connect'
  );
  const primarySecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
  const candidateSecrets = isConnectWebhookPath
    ? [connectSecret, primarySecret].filter(
        (s): s is string => typeof s === 'string' && s.length > 0
      )
    : [primarySecret].filter(
        (s): s is string => typeof s === 'string' && s.length > 0
      );
  if (candidateSecrets.length === 0) {
    console.error(
      isConnectWebhookPath
        ? 'Stripe connect webhook secret is not set (STRIPE_CONNECT_WEBHOOK_SECRET)'
        : 'STRIPE_WEBHOOK_SECRET is not set'
    );
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch (e) {
    console.error('Stripe webhook: failed to read body', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripePlatform();
    let parsedEvent: Stripe.Event | null = null;
    let lastErr: unknown = null;
    for (const secret of candidateSecrets) {
      try {
        parsedEvent = stripe.webhooks.constructEvent(body, signature, secret);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!parsedEvent) {
      throw lastErr ?? new Error('Webhook signature verification failed');
    }
    event = parsedEvent;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Only process and persist idempotency for events we handle; ignore the rest (return 200 so Stripe doesn't retry)
  if (event.type === 'checkout.session.completed') {
    // Idempotency: process this event only once
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
    } catch (insertError: unknown) {
      const code = (insertError as { code?: string })?.code;
      if (code === '23505') {
        // Unique violation = already processed (e.g. Stripe retry)
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('Stripe webhook idempotency insert error:', insertError);
      return NextResponse.json(
        { error: 'Idempotency check failed' },
        { status: 500 }
      );
    }
    const session = event.data.object as Stripe.Checkout.Session;
    const isBookingCheckout = session.metadata?.kind === 'booking_checkout';
    if (isBookingCheckout) {
      logBookingCheckoutStage('checkout.session.completed.received', {
        eventId: event.id,
        sessionId: session.id,
      });
      logBookingWebhook('checkout.session.completed received', {
        eventId: event.id,
        sessionId: session.id,
      });
      const checkoutSessionRowId =
        typeof session.metadata?.bookingCheckoutSessionId === 'string'
          ? session.metadata.bookingCheckoutSessionId.trim()
          : '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkoutSessionQuery = (supabase as any)
        .from('booking_checkout_sessions')
        .select('*');
      let checkoutSessionRow: Record<string, unknown> | null = null;
      if (checkoutSessionRowId) {
        const { data } = await checkoutSessionQuery
          .eq('id', checkoutSessionRowId)
          .maybeSingle();
        checkoutSessionRow = (data as Record<string, unknown> | null) ?? null;
      }
      if (!checkoutSessionRow) {
        const { data } = await checkoutSessionQuery
          .eq('stripe_checkout_session_id', session.id)
          .maybeSingle();
        checkoutSessionRow = (data as Record<string, unknown> | null) ?? null;
      }
      if (!checkoutSessionRow) {
        logBookingCheckoutStage('checkout_session_row.missing', {
          eventId: event.id,
          sessionId: session.id,
        });
        logBookingWebhook('missing booking_checkout_sessions row', {
          sessionId: session.id,
          checkoutSessionRowId,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }
      const bookingPayload = parseStoredBookingCheckoutPayload(
        checkoutSessionRow.booking_payload
      );
      if (!bookingPayload) {
        logBookingCheckoutStage('booking_payload.invalid', {
          eventId: event.id,
          sessionId: session.id,
          checkoutSessionRowId: String(checkoutSessionRow.id),
        });
        console.error(
          '[booking-checkout:webhook] invalid booking_payload for row',
          checkoutSessionRow.id
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('booking_checkout_sessions')
          .update({ status: 'failed' })
          .eq('id', checkoutSessionRow.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }
      const stripeCollectedEmail = stripeCheckoutCollectedEmail(session);
      const resolvedCustomerEmail =
        bookingPayload.customer.email.trim() || stripeCollectedEmail;
      const amountPaidCents =
        typeof session.amount_total === 'number' ? session.amount_total : 0;
      const expectedAmountCents =
        typeof checkoutSessionRow.expected_amount_cents === 'number'
          ? checkoutSessionRow.expected_amount_cents
          : bookingPayload.requiredOnlineAmountCents;
      if (amountPaidCents !== expectedAmountCents) {
        logBookingCheckoutStage('amount_mismatch', {
          eventId: event.id,
          sessionId: session.id,
          checkoutSessionRowId: String(checkoutSessionRow.id),
        });
        logBookingWebhook('amount mismatch', {
          rowId: checkoutSessionRow.id,
          sessionId: session.id,
          expectedAmountCents,
          amountPaidCents,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('booking_checkout_sessions')
          .update({
            status: 'failed',
            actual_amount_cents: amountPaidCents,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
          })
          .eq('id', checkoutSessionRow.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: capProfileRow, error: capProfileError } = await supabase
        .from('business_profiles')
        .select(
          'id, profile_id, free_bookings_month, free_bookings_count, business_name, service_location_mode, service_area, business_zip, shop_street_address, shop_unit'
        )
        .eq('id', bookingPayload.businessId.trim())
        .maybeSingle();

      if (capProfileError || !capProfileRow) {
        logBookingCheckoutStage('business_profile.missing_for_cap', {
          eventId: event.id,
          sessionId: session.id,
          checkoutSessionRowId: String(checkoutSessionRow.id),
        });
        console.error(
          '[booking-checkout:webhook] business profile not found for cap',
          capProfileError,
          bookingPayload.businessId
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('booking_checkout_sessions')
          .update({ status: 'failed' })
          .eq('id', checkoutSessionRow.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const capProfile = capProfileRow as {
        id: string;
        profile_id: string | null;
        free_bookings_month: string | null;
        free_bookings_count: number | null;
        business_name: string | null;
        service_location_mode: string | null;
        service_area: string | null;
        business_zip: string | null;
        shop_street_address: string | null;
        shop_unit: string | null;
      };

      const freeTierCap = await enforceFreeTierBookingCapBeforeCreate(
        supabase,
        capProfile
      );
      if (!freeTierCap.ok) {
        logBookingCheckoutStage('free_tier_booking_cap', {
          eventId: event.id,
          sessionId: session.id,
          checkoutSessionRowId: String(checkoutSessionRow.id),
        });
        console.warn('[booking-checkout:webhook] free tier cap', {
          businessId: bookingPayload.businessId,
          sessionId: session.id,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('booking_checkout_sessions')
          .update({ status: 'failed' })
          .eq('id', checkoutSessionRow.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const optionLabel = bookingPayload.servicePriceOptionLabel?.trim();
      const storedServiceName = optionLabel
        ? `${bookingPayload.serviceName.trim()} — ${optionLabel}`
        : bookingPayload.serviceName.trim();
      const serviceLocation = buildPublicBookingServiceLocation(capProfile);
      const locationResolved = resolveEffectiveCustomerServiceLocation(
        serviceLocation.mode,
        clientServiceLocationChoice(bookingPayload)
      );
      const effectiveLocationType =
        locationResolved.effective ??
        (serviceLocation.mode === 'shop_only' ? 'shop' : 'mobile');
      const createdBooking = await createBooking(supabase, {
        businessId: bookingPayload.businessId,
        businessSlug: bookingPayload.businessSlug,
        serviceId: bookingPayload.serviceId,
        serviceName: storedServiceName,
        servicePriceCents: bookingPayload.servicePriceCents,
        selectedAddOns: bookingPayload.selectedAddOns,
        durationMinutes: bookingPayload.durationMinutes,
        scheduledDate: bookingPayload.scheduledDate,
        startTime: bookingPayload.startTime,
        customer: customerFormFromCheckoutStored(bookingPayload.customer),
        serviceLocationType: resolvePersistedBookingServiceLocationType({
          clientChoice: effectiveLocationType,
          businessMode: serviceLocation.mode,
        }),
      });
      logBookingCheckoutStage('booking.created', {
        eventId: event.id,
        sessionId: session.id,
        checkoutSessionRowId: String(checkoutSessionRow.id),
        bookingId: createdBooking.id,
      });
      const remainingCents = Math.max(
        bookingPayload.totalPriceCents - amountPaidCents,
        0
      );
      const paymentStatus = remainingCents > 0 ? 'deposit_paid' : 'paid_full';
      const currencyCode =
        typeof session.currency === 'string' && session.currency.trim()
          ? session.currency.trim().toLowerCase()
          : 'usd';
      const selectedAddOnsForEmail = bookingPayload.selectedAddOns ?? [];
      const basePriceForEmail = bookingPayload.servicePriceCents ?? 0;
      const addOnTotalForEmail = selectedAddOnsForEmail.reduce(
        (sum, addOn) => sum + (addOn.priceCents ?? 0),
        0
      );
      const totalPriceCentsForEmail = basePriceForEmail + addOnTotalForEmail;
      const hasPriceLineItems =
        (typeof bookingPayload.servicePriceCents === 'number' &&
          bookingPayload.servicePriceCents > 0) ||
        selectedAddOnsForEmail.length > 0;
      const emailServiceLocation = buildAvailabilityBookingEmailServiceLocation(
        {
          effectiveType: effectiveLocationType,
          shopAddressLabel: serviceLocation.shopAddressLabel,
          customerStreet: bookingPayload.customer.streetAddress,
          customerUnit: bookingPayload.customer.unitApt,
          customerCity: bookingPayload.customer.city,
          customerState: bookingPayload.customer.state,
          customerZip: bookingPayload.customer.zip,
        }
      );
      const profileId = capProfile.profile_id ?? null;
      const businessDisplayName =
        capProfile.business_name?.trim() || bookingPayload.businessSlug;
      const availabilityEmailPayload: AvailabilityBookingNotificationPayload = {
        customerName: bookingPayload.customer.fullName.trim(),
        customerEmail: resolvedCustomerEmail,
        customerPhone: bookingPayload.customer.phone?.trim(),
        customerVehicleYear: bookingPayload.customer.vehicleYear?.trim(),
        customerVehicleMake: bookingPayload.customer.vehicleMake?.trim(),
        customerVehicleModel: bookingPayload.customer.vehicleModel?.trim(),
        serviceName: bookingPayload.serviceName.trim(),
        servicePriceOptionLabel: optionLabel || undefined,
        scheduledDate: bookingPayload.scheduledDate,
        startTime: bookingPayload.startTime,
        durationMinutes: bookingPayload.durationMinutes,
        servicePriceCents: bookingPayload.servicePriceCents,
        selectedAddOns: selectedAddOnsForEmail,
        totalPriceCents: totalPriceCentsForEmail,
        paymentSummary: buildStripeCheckoutPaymentSummary({
          paymentStatus,
          amountPaidCents,
          remainingCents,
          totalPriceCents: bookingPayload.totalPriceCents,
          currency: currencyCode,
          hasPriceLineItems,
        }),
        serviceLocation: emailServiceLocation,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('booking_payments').insert({
        booking_id: createdBooking.id,
        business_id: bookingPayload.businessId,
        provider: 'stripe',
        payment_status: paymentStatus,
        payment_method_selected: bookingPayload.paymentMethodSelected,
        currency: currencyCode,
        total_amount_cents: bookingPayload.totalPriceCents,
        required_online_amount_cents: bookingPayload.requiredOnlineAmountCents,
        paid_online_amount_cents: amountPaidCents,
        remaining_amount_cents: remainingCents,
        deposit_type: bookingPayload.depositType,
        deposit_value: bookingPayload.depositValue,
        last_checkout_session_id: session.id,
        paid_at: new Date().toISOString(),
      });
      logBookingCheckoutStage('booking_payment.inserted', {
        eventId: event.id,
        sessionId: session.id,
        bookingId: createdBooking.id,
        paymentStatus,
      });
      await notifyOwnerForAvailabilityBookingCreated(supabase, {
        profileId,
        bookingId: createdBooking.id,
        customerName: bookingPayload.customer.fullName.trim(),
        serviceSummaryLine: storedServiceName,
        scheduledDate: bookingPayload.scheduledDate,
        emailPayload: availabilityEmailPayload,
      });
      logBookingCheckoutStage('owner_notified', {
        eventId: event.id,
        sessionId: session.id,
        bookingId: createdBooking.id,
      });
      if (resolvedCustomerEmail) {
        try {
          await sendAvailabilityBookingCustomerConfirmationEmail(
            resolvedCustomerEmail,
            businessDisplayName,
            availabilityEmailPayload
          );
          logBookingCheckoutStage('customer_email.sent', {
            eventId: event.id,
            sessionId: session.id,
            bookingId: createdBooking.id,
          });
        } catch {
          // best-effort customer confirmation email
          logBookingCheckoutStage('customer_email.failed', {
            eventId: event.id,
            sessionId: session.id,
            bookingId: createdBooking.id,
          });
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('booking_checkout_sessions')
        .update({
          status: 'completed',
          booking_id: createdBooking.id,
          actual_amount_cents: amountPaidCents,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', checkoutSessionRow.id);
      logBookingCheckoutStage('checkout_session.completed', {
        eventId: event.id,
        sessionId: session.id,
        checkoutSessionRowId: String(checkoutSessionRow.id),
        bookingId: createdBooking.id,
        paymentStatus,
      });
      logBookingWebhook('booking created from webhook success', {
        eventId: event.id,
        sessionId: session.id,
        bookingId: createdBooking.id,
        paymentStatus,
        amountPaidCents,
        remainingCents,
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (session.metadata?.kind === 'maintenance_enrollment') {
      const enrollmentId =
        typeof session.metadata?.maintenanceEnrollmentId === 'string'
          ? session.metadata.maintenanceEnrollmentId.trim()
          : '';
      const expectedRaw = session.metadata?.expectedAmountCents;
      const expectedAmountCents =
        typeof expectedRaw === 'string'
          ? parseInt(expectedRaw, 10)
          : typeof expectedRaw === 'number'
            ? Math.round(expectedRaw)
            : NaN;

      if (!enrollmentId || !Number.isFinite(expectedAmountCents)) {
        console.error(
          '[maintenance:webhook] checkout.session.completed missing metadata',
          { eventId: event.id, sessionId: session.id }
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: maintRow, error: maintLoadErr } = await (supabase as any)
        .from('maintenance_enrollments')
        .select(
          'id, status, payment_status, price_cents, stripe_checkout_session_id, anchor_date, anchor_time'
        )
        .eq('id', enrollmentId)
        .maybeSingle();

      if (maintLoadErr || !maintRow) {
        console.error('[maintenance:webhook] enrollment not found', {
          enrollmentId,
          error: maintLoadErr,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (!hasMaintenanceAnchorScheduled(maintRow)) {
        console.error('[maintenance:webhook] missing first-visit anchor', {
          enrollmentId,
          sessionId: session.id,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const rowSessionId = String(
        (maintRow as { stripe_checkout_session_id?: string | null })
          .stripe_checkout_session_id ?? ''
      ).trim();
      if (rowSessionId && rowSessionId !== session.id) {
        console.warn('[maintenance:webhook] session id mismatch', {
          enrollmentId,
          rowSessionId,
          sessionId: session.id,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const priceCents = Math.round(
        Number((maintRow as { price_cents?: number }).price_cents ?? 0)
      );
      if (priceCents !== expectedAmountCents) {
        console.error('[maintenance:webhook] metadata amount vs row mismatch', {
          enrollmentId,
          priceCents,
          expectedAmountCents,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const amountPaidCents =
        typeof session.amount_total === 'number' ? session.amount_total : 0;
      if (amountPaidCents !== expectedAmountCents) {
        console.error('[maintenance:webhook] amount mismatch', {
          enrollmentId,
          amountPaidCents,
          expectedAmountCents,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const nowIso = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- maintenance_enrollments not in generated Database types
      const maintDb = supabase as any;
      const { error: maintUpdateErr } = await maintDb
        .from('maintenance_enrollments')
        .update({
          status: 'accepted',
          accepted_at: nowIso,
          payment_status: MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD,
          customer_selected_payment: 'card',
        })
        .eq('id', enrollmentId)
        .eq('status', 'enrolled_pending_customer')
        .eq('payment_status', 'pending');

      if (maintUpdateErr) {
        console.error('[maintenance:webhook] update failed', maintUpdateErr);
        return NextResponse.json(
          { error: 'Maintenance enrollment update failed' },
          { status: 500 }
        );
      }

      try {
        const ensured = await ensureMaintenanceEnrollmentInitialBooking(
          supabase,
          enrollmentId,
          {
            stripeCheckoutSessionId: session.id,
          }
        );
        if (!ensured.created && ensured.skippedReason) {
          console.warn('[maintenance:webhook] calendar booking not created', {
            enrollmentId,
            sessionId: session.id,
            skippedReason: ensured.skippedReason,
          });
        }
      } catch (ensureErr) {
        console.error(
          '[maintenance:webhook] ensure calendar booking failed',
          ensureErr,
          { enrollmentId, sessionId: session.id }
        );
      }

      void sendMaintenanceEnrollmentConfirmedIfApplicable(
        supabase,
        enrollmentId
      ).catch(err => {
        console.error('[maintenance:webhook] confirmation email', err);
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    const userId = session.metadata?.userId as string | undefined;
    if (!userId?.trim()) {
      console.error(
        'Stripe webhook: checkout.session.completed missing metadata.userId'
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const stripe = getStripePlatform();
    const applyResult = await applyPlatformProCheckoutSessionCompleted(
      supabase,
      stripe,
      session
    );
    if (!applyResult.success) {
      console.error(
        'Stripe webhook: apply platform subscription checkout failed',
        applyResult.error
      );
      return NextResponse.json(
        { error: 'Profile update failed' },
        { status: 500 }
      );
    }

    // First paid Pro upgrade only (direct paid checkout — no trial). Best-effort;
    // the atomic claim inside guarantees once-only across retries/resubscribes.
    void sendProWelcomeIfFirstPaidPro(supabase, { userId }).catch(err => {
      console.error('[stripe:webhook] pro welcome email (checkout)', err);
    });
  }

  // Subscription updated (renewal, status change to past_due/unpaid, etc.)
  if (event.type === 'customer.subscription.updated') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
    } catch (insertError: unknown) {
      const code = (insertError as { code?: string })?.code;
      if (code === '23505') {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('Stripe webhook idempotency insert error:', insertError);
      return NextResponse.json(
        { error: 'Idempotency check failed' },
        { status: 500 }
      );
    }
    const subscription = event.data.object as Stripe.Subscription;
    const subId = typeof subscription.id === 'string' ? subscription.id : null;
    if (!subId) {
      console.warn(
        '[Stripe webhook] customer.subscription.updated missing subscription id',
        { eventId: event.id }
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    /** Event payload can lag; use retrieve for authoritative fields + scheduled cancel detection. */
    let periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
    let status = subscription.status ?? 'active';
    let cancelAtPeriodEnd =
      subscriptionIsScheduledCancelWithoutRenewal(subscription);
    try {
      const stripe = getStripePlatform();
      const fresh = await stripe.subscriptions.retrieve(subId);
      periodEnd = subscriptionCurrentPeriodEndUnix(fresh);
      status = fresh.status;
      cancelAtPeriodEnd = subscriptionIsScheduledCancelWithoutRenewal(fresh);
    } catch (retrieveErr) {
      console.warn(
        '[Stripe webhook] subscriptions.retrieve failed; using event payload',
        { eventId: event.id, stripeSubscriptionId: subId, retrieveErr }
      );
      periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
      status = subscription.status ?? 'active';
      cancelAtPeriodEnd =
        subscriptionIsScheduledCancelWithoutRenewal(subscription);
    }

    const result = await syncProfileFromSubscriptionUpdated(supabase, {
      stripeSubscriptionId: subId,
      subscriptionStatus: status,
      currentPeriodEndUnix: periodEnd ?? null,
      cancelAtPeriodEnd,
    });
    if (!result.success) {
      if (result.noMatchingProfile) {
        console.warn(
          '[Stripe webhook] customer.subscription.updated: no profile row for subscription (skip)',
          { eventId: event.id, stripeSubscriptionId: subId }
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error(
        'Stripe webhook: syncProfileFromSubscriptionUpdated failed',
        result.error
      );
      return NextResponse.json(
        { error: 'Profile sync failed' },
        { status: 500 }
      );
    }

    // Covers trial -> paid conversion (status becomes `active`). First-time only:
    // the atomic claim ensures renewals and cancel->resubscribe never re-send.
    void sendProWelcomeIfFirstPaidPro(supabase, {
      stripeSubscriptionId: subId,
    }).catch(err => {
      console.error(
        '[stripe:webhook] pro welcome email (subscription.updated)',
        err
      );
    });
  }

  // When subscription ends (user cancelled and period ended, or payment failed etc.)
  if (event.type === 'customer.subscription.deleted') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
    } catch (insertError: unknown) {
      const code = (insertError as { code?: string })?.code;
      if (code === '23505') {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('Stripe webhook idempotency insert error:', insertError);
      return NextResponse.json(
        { error: 'Idempotency check failed' },
        { status: 500 }
      );
    }
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId =
      typeof subscription.id === 'string' ? subscription.id : null;
    if (!subscriptionId) {
      console.warn(
        '[Stripe webhook] customer.subscription.deleted missing subscription id',
        { eventId: event.id }
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await downgradeProfileFromSubscriptionEnd(
      supabase,
      subscriptionId
    );
    if (!result.success) {
      console.error(
        'Stripe webhook: downgradeProfileFromSubscriptionEnd failed',
        result.error
      );
      return NextResponse.json(
        { error: 'Profile downgrade failed' },
        { status: 500 }
      );
    }
  }

  // Recurring payment failed — sync profile only (no ServiceLink email; use in-app Settings banner + Stripe optional emails).
  if (event.type === 'invoice.payment_failed') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
    } catch (insertError: unknown) {
      const code = (insertError as { code?: string })?.code;
      if (code === '23505') {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('Stripe webhook idempotency insert error:', insertError);
      return NextResponse.json(
        { error: 'Idempotency check failed' },
        { status: 500 }
      );
    }
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionRef = (
      invoice as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      }
    ).subscription;
    const subscriptionId =
      typeof subscriptionRef === 'string'
        ? subscriptionRef
        : subscriptionRef && typeof subscriptionRef === 'object'
          ? (subscriptionRef as Stripe.Subscription).id
          : null;
    if (subscriptionId) {
      try {
        const stripe = getStripePlatform();
        const retrieved = await stripe.subscriptions.retrieve(subscriptionId);
        const subscription = retrieved;
        const periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
        const syncResult = await syncProfileFromSubscriptionUpdated(supabase, {
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          currentPeriodEndUnix: periodEnd ?? null,
          cancelAtPeriodEnd:
            subscriptionIsScheduledCancelWithoutRenewal(subscription),
          // Don't let a transient `active` status here clear the failure guard —
          // recovery is handled by the `customer.subscription.updated` path.
          resetPaymentFailedFlagOnGrant: false,
        });
        if (!syncResult.success) {
          console.error(
            'Stripe webhook: sync after invoice.payment_failed failed',
            syncResult.error
          );
        }
      } catch (e) {
        console.error(
          'Stripe webhook: retrieve subscription after payment_failed failed',
          e
        );
      }

      // Tell the owner once per failure episode (Stripe retries fire this event
      // repeatedly; the atomic claim inside guards against re-sending).
      const invoiceCustomerEmail =
        typeof invoice.customer_email === 'string'
          ? invoice.customer_email
          : null;
      void notifyPaymentFailedOnce(supabase, {
        stripeSubscriptionId: subscriptionId,
        invoiceCustomerEmail,
      }).catch(err => {
        console.error('[stripe:webhook] payment failed email', err);
      });
    } else {
      console.warn(
        '[Stripe webhook] invoice.payment_failed no subscription on invoice',
        { eventId: event.id }
      );
    }
  }

  // Trial reminder before the first charge (Stripe emits this before trial end).
  if (event.type === 'customer.subscription.trial_will_end') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
    } catch (insertError: unknown) {
      const code = (insertError as { code?: string })?.code;
      if (code === '23505') {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('Stripe webhook idempotency insert error:', insertError);
      return NextResponse.json(
        { error: 'Idempotency check failed' },
        { status: 500 }
      );
    }

    const subscription = event.data.object as Stripe.Subscription;
    const trialEndIso =
      typeof subscription.trial_end === 'number'
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;
    let customerEmail: string | null = null;
    try {
      const stripe = getStripePlatform();
      const customerRef = subscription.customer;
      const customerId =
        typeof customerRef === 'string' ? customerRef : customerRef?.id;
      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!('deleted' in customer) || customer.deleted !== true) {
          customerEmail = customer.email ?? null;
        }
      }
    } catch (err) {
      console.error(
        '[Stripe webhook] trial_will_end: failed to resolve customer email',
        err
      );
    }

    if (customerEmail?.trim()) {
      const emailResult = await sendTrialEndingSoonEmail(customerEmail.trim(), {
        trialEndsAtIso: trialEndIso,
      });
      if (!emailResult.sent) {
        console.error(
          '[Stripe webhook] trial_will_end: sendTrialEndingSoonEmail failed',
          emailResult.error
        );
      }
    } else {
      console.warn(
        '[Stripe webhook] trial_will_end: no customer email resolved',
        { eventId: event.id, subscriptionId: subscription.id }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
