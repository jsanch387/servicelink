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

import { sendSubscriptionPaymentFailedEmail } from '@/features/email';
import { downgradeProfileFromSubscriptionEnd } from '@/features/pricing/server/downgradeProfileFromSubscriptionEnd';
import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { subscriptionIsScheduledCancelWithoutRenewal } from '@/features/pricing/utils/subscriptionScheduledCancel';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(secret);
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
      const stripe = getStripe();
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
      const stripe = getStripe();
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
    if (subscriptionId) {
      try {
        const stripe = getStripe();
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
    } else {
      console.warn(
        '[Stripe webhook] invoice.payment_failed no customer_email on invoice',
        { eventId: event.id }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
