/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint. Verifies signature, ensures idempotency, then
 * updates the database (e.g. set user to Pro after checkout.session.completed).
 *
 * Env: STRIPE_WEBHOOK_SECRET (whsec_... from Stripe Dashboard → Webhooks).
 * Requires stripe_webhook_events table for idempotency (see README).
 */

import { sendSubscriptionPaymentFailedEmail } from '@/features/email';
import { downgradeProfileFromSubscriptionEnd } from '@/features/pricing/server/downgradeProfileFromSubscriptionEnd';
import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(secret);
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
    const stripe = getStripe();
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
        const stripe = getStripe();
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
