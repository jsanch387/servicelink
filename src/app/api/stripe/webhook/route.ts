/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint. Verifies signature, ensures idempotency, then
 * updates the database (e.g. set user to Pro after checkout.session.completed).
 *
 * Env: STRIPE_WEBHOOK_SECRET (whsec_... from Stripe Dashboard → Webhooks).
 * Requires stripe_webhook_events table for idempotency (see README).
 */

import type { CustomerFormData } from '@/features/availability/booking/types';
import { createBooking } from '@/features/availability/services/bookingService';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  sendSubscriptionPaymentFailedEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { downgradeProfileFromSubscriptionEnd } from '@/features/pricing/server/downgradeProfileFromSubscriptionEnd';
import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
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
  if (payload != null) {
    console.log('[booking-checkout:webhook]', message, payload);
  } else {
    console.log('[booking-checkout:webhook]', message);
  }
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

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
      await notifyOwnerForAvailabilityBookingCreated(supabase, {
        profileId,
        bookingId: createdBooking.id,
        customerName: bookingPayload.customer.fullName.trim(),
        serviceSummaryLine: storedServiceName,
        scheduledDate: bookingPayload.scheduledDate,
        emailPayload: availabilityEmailPayload,
      });
      try {
        await sendAvailabilityBookingCustomerConfirmationEmail(
          bookingPayload.customer.email.trim(),
          businessDisplayName,
          availabilityEmailPayload
        );
      } catch {
        // best-effort customer confirmation email
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
    if (stripeSubscriptionId) {
      try {
        const stripe = getStripePlatform();
        const subscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const periodEnd = (subscription as { current_period_end?: number })
          .current_period_end;
        currentPeriodEnd =
          periodEnd != null ? new Date(periodEnd * 1000).toISOString() : null;
      } catch (e) {
        console.error('Stripe webhook: failed to retrieve subscription', e);
      }
    }

    const result = await updateProfileFromCheckout(supabase, {
      userId: userId.trim(),
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
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
    const periodEnd = (subscription as { current_period_end?: number })
      .current_period_end;
    const status = (subscription as { status?: string }).status ?? 'active';
    if (!subId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const result = await syncProfileFromSubscriptionUpdated(supabase, {
      stripeSubscriptionId: subId,
      subscriptionStatus: status,
      currentPeriodEndUnix: periodEnd ?? null,
    });
    if (!result.success) {
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
    const customerEmail = (invoice as { customer_email?: string | null })
      .customer_email;
    if (customerEmail?.trim()) {
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
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
