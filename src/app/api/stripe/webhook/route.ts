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
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  sendSubscriptionPaymentFailedEmail,
  sendTrialEndingSoonEmail,
  sendWelcomeLiveEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { completeOnboardingV2 } from '@/features/onboarding-v2/server/completeOnboarding';
import { downgradeProfileFromSubscriptionEnd } from '@/features/pricing/server/downgradeProfileFromSubscriptionEnd';
import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { subscriptionIsScheduledCancelWithoutRenewal } from '@/features/pricing/utils/subscriptionScheduledCancel';
import { getStripePlatform } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const DELINQUENT_OR_ENDED_STATUSES = new Set([
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
]);

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
  if (
    !businessId ||
    !businessSlug ||
    !serviceName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
    !/^\d{1,2}:\d{2}$/.test(startTime) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 1 ||
    !fullName ||
    !email ||
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
  };
}

/**
 * Current billing period end (unix seconds). Basil API stores period bounds on
 * subscription items; fall back to legacy subscription-level field if present.
 */
function subscriptionCurrentPeriodEndUnix(
  subscription: Stripe.Subscription
): number | null {
  const items = subscription.items?.data;
  if (items && items.length > 0) {
    return Math.max(...items.map(i => i.current_period_end));
  }
  const legacy = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };
  return legacy.current_period_end ?? null;
}

/** Best-effort: subscription can lag right after checkout — retry once before writing null period end. */
async function retrieveSubscriptionCurrentPeriodEndIso(
  stripe: Stripe,
  subscriptionId: string
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
      if (periodEnd != null) {
        return new Date(periodEnd * 1000).toISOString();
      }
    } catch (e) {
      console.error(
        `Stripe webhook: subscriptions.retrieve attempt ${attempt + 1} failed`,
        e
      );
    }
    if (attempt === 0) {
      await new Promise(r => setTimeout(r, 750));
    }
  }
  console.warn(
    'Stripe webhook: subscription period end still null after checkout retrieve (will rely on customer.subscription.updated)'
  );
  return null;
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

      const optionLabel = bookingPayload.servicePriceOptionLabel?.trim();
      const storedServiceName = optionLabel
        ? `${bookingPayload.serviceName.trim()} — ${optionLabel}`
        : bookingPayload.serviceName.trim();
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
      const formatMoney = (cents: number) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCode.toUpperCase(),
        }).format(cents / 100);
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
      const depositPaymentRows: Array<{ label: string; value: string }> = [
        { label: 'Deposit paid', value: formatMoney(amountPaidCents) },
        {
          label: 'Remaining balance',
          value: formatMoney(remainingCents),
        },
      ];
      if (!hasPriceLineItems) {
        depositPaymentRows.push({
          label: 'Appointment total',
          value: formatMoney(bookingPayload.totalPriceCents),
        });
      }
      const availabilityEmailPayload: AvailabilityBookingNotificationPayload = {
        customerName: bookingPayload.customer.fullName.trim(),
        customerEmail: bookingPayload.customer.email.trim(),
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
        paymentSummary: {
          title: 'Payment',
          rows:
            paymentStatus === 'paid_full'
              ? [{ label: 'Paid in full', value: formatMoney(amountPaidCents) }]
              : depositPaymentRows,
          stripeCardPayment: true,
        },
      };
      const { data: businessRow } = await supabase
        .from('business_profiles')
        .select('profile_id, business_name')
        .eq('id', bookingPayload.businessId)
        .maybeSingle();
      const profileId =
        (businessRow as { profile_id?: string | null } | null)?.profile_id ??
        null;
      const businessDisplayName =
        (
          businessRow as { business_name?: string | null } | null
        )?.business_name?.trim() || bookingPayload.businessSlug;
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
      try {
        await sendAvailabilityBookingCustomerConfirmationEmail(
          bookingPayload.customer.email.trim(),
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
    const userId = session.metadata?.userId as string | undefined;
    if (!userId?.trim()) {
      console.error(
        'Stripe webhook: checkout.session.completed missing metadata.userId'
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer?.id ?? null);
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription?.id ?? null);

    let currentPeriodEnd: string | null = null;
    let subscriptionStatus: string | null = null;
    if (stripeSubscriptionId) {
      const stripe = getStripePlatform();
      try {
        const subscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);
        subscriptionStatus = subscription.status ?? null;
      } catch (retrieveErr) {
        console.warn(
          '[Stripe webhook] subscriptions.retrieve status fetch failed after checkout',
          { eventId: event.id, stripeSubscriptionId, retrieveErr }
        );
      }
      currentPeriodEnd = await retrieveSubscriptionCurrentPeriodEndIso(
        stripe,
        stripeSubscriptionId
      );
    }

    const result = await updateProfileFromCheckout(supabase, {
      userId: userId.trim(),
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
      subscriptionStatus,
    });

    if (!result.success) {
      console.error(
        'Stripe webhook: updateProfileFromCheckout failed',
        result.error
      );
      return NextResponse.json(
        { error: 'Profile update failed' },
        { status: 500 }
      );
    }

    // Onboarding monetization bridge:
    // only mark onboarding complete after successful checkout event.
    if (session.metadata?.source === 'onboarding_trial_bridge') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileBeforeComplete } = await (supabase as any)
        .from('profiles')
        .select('onboarding_status')
        .eq('user_id', userId.trim())
        .single();
      const wasAlreadyCompleted =
        profileBeforeComplete?.onboarding_status === 'completed';

      const completeResult = await completeOnboardingV2(
        supabase,
        userId.trim()
      );
      if (!completeResult.success) {
        console.error(
          'Stripe webhook: completeOnboardingV2 failed for onboarding bridge',
          completeResult.error
        );
        return NextResponse.json(
          { error: 'Onboarding completion failed' },
          { status: 500 }
        );
      }

      if (!wasAlreadyCompleted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: businessProfile } = await (supabase as any)
          .from('business_profiles')
          .select('business_slug')
          .eq('profile_id', userId.trim())
          .single();
        const businessSlug = businessProfile?.business_slug?.trim();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authResult = await (supabase as any).auth.admin.getUserById(
          userId.trim()
        );
        const userEmail = authResult?.data?.user?.email?.trim();

        if (businessSlug && userEmail) {
          const emailResult = await sendWelcomeLiveEmail(userEmail, {
            businessSlug,
          });
          if (!emailResult.sent) {
            console.error(
              'Stripe webhook: failed to send onboarding welcome live email',
              emailResult.error
            );
          }
        }
      }
    }
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

  // Recurring payment failed (card declined, expired, etc.) – notify customer
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
    let priorSubscriptionStatus: string | null = null;
    if (subscriptionId) {
      // Capture previous DB status before sync so we only send one failure email
      // when the account first enters a delinquent state.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: priorProfile } = await (supabase as any)
        .from('profiles')
        .select('subscription_status')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      priorSubscriptionStatus =
        (priorProfile as { subscription_status?: string | null } | null)
          ?.subscription_status ?? null;
    }
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
    } else {
      console.warn(
        '[Stripe webhook] invoice.payment_failed no subscription on invoice',
        { eventId: event.id }
      );
    }
    const customerEmail = (invoice as { customer_email?: string | null })
      .customer_email;
    const priorStatusNormalized = priorSubscriptionStatus?.trim() || '';
    const shouldSendFailedEmail =
      !priorStatusNormalized ||
      !DELINQUENT_OR_ENDED_STATUSES.has(priorStatusNormalized);
    if (customerEmail?.trim()) {
      if (shouldSendFailedEmail) {
        const emailResult = await sendSubscriptionPaymentFailedEmail(
          customerEmail.trim()
        );
        if (!emailResult.sent) {
          console.error(
            'Stripe webhook: sendSubscriptionPaymentFailedEmail failed',
            emailResult.error
          );
          // Don't return 500 – we've recorded idempotency; Stripe would retry and we'd skip. Log is enough.
        }
      }
    } else {
      console.warn(
        '[Stripe webhook] invoice.payment_failed no customer_email on invoice',
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
