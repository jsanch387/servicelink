import { getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { ensureMembershipInitialBooking } from './ensureMembershipInitialBooking';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
} from './membershipsTransactionLog';
import {
  isMembershipCheckoutKind,
  stripeIdFromExpandable,
} from './membershipStripeHelpers';
import { recordMembershipEvent } from './recordMembershipEvent';
import { sendMembershipSubscribeConfirmedIfApplicable } from './sendMembershipSubscribeConfirmedIfApplicable';
import { upsertCustomerMembershipFromSubscription } from './upsertCustomerMembershipFromSubscription';

/**
 * Connect `checkout.session.completed` with `metadata.kind = membership_checkout`.
 * Creates/updates `customer_memberships` + first-visit booking + emails.
 */
export async function applyMembershipCheckoutSessionCompleted(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    session: Stripe.Checkout.Session;
  }
): Promise<{ handled: true } | { handled: false; reason: string }> {
  const { event, session } = args;
  if (!isMembershipCheckoutKind(session.metadata)) {
    return { handled: false, reason: 'not_membership_checkout' };
  }

  const stripeAccountId =
    typeof event.account === 'string' ? event.account.trim() : '';
  if (!stripeAccountId) {
    logMemberships(event.id, 'error', 'checkout.missing_connect_account', {
      sessionId: shortStripeIdForLog(session.id),
      reason: 'Connect event missing event.account',
    });
    return { handled: true };
  }

  const businessId = session.metadata?.businessId?.trim() ?? '';
  const planId = session.metadata?.membershipPlanId?.trim() || null;
  const planPriceId = session.metadata?.membershipPlanPriceId?.trim() || null;
  if (!businessId) {
    logMemberships(event.id, 'error', 'checkout.missing_business_id', {
      sessionId: shortStripeIdForLog(session.id),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      reason: 'Session metadata missing businessId',
    });
    return { handled: true };
  }

  const subscriptionId = stripeIdFromExpandable(session.subscription);
  if (!subscriptionId) {
    logMemberships(event.id, 'error', 'checkout.missing_subscription', {
      sessionId: shortStripeIdForLog(session.id),
      businessId: shortIdForLog(businessId),
      reason: 'Checkout session has no subscription id',
    });
    return { handled: true };
  }

  let subscription: Stripe.Subscription;
  try {
    const stripe = getStripeConnectClient(stripeAccountId);
    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    });
  } catch (err) {
    logMemberships(event.id, 'error', 'checkout.subscription_retrieve_failed', {
      sessionId: shortStripeIdForLog(session.id),
      businessId: shortIdForLog(businessId),
      stripeSubscriptionId: shortStripeIdForLog(subscriptionId),
      reason: 'Failed to retrieve Connect subscription',
      error: err instanceof Error ? err.message : 'unknown',
    });
    return { handled: true };
  }

  const details = session.customer_details;
  let phone =
    details?.phone?.trim() ||
    (typeof session.customer_details?.phone === 'string'
      ? session.customer_details.phone.trim()
      : '') ||
    '';

  // Checkout phone collection sometimes lands on the Customer, not session.details.
  if (!phone) {
    const customerId = stripeIdFromExpandable(session.customer);
    if (customerId) {
      try {
        const stripe = getStripeConnectClient(stripeAccountId);
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && typeof customer.phone === 'string') {
          phone = customer.phone.trim();
        }
      } catch {
        // best-effort
      }
    }
  }

  const upsert = await upsertCustomerMembershipFromSubscription(supabase, {
    stripeAccountId,
    subscription,
    businessId,
    planId,
    planPriceId,
    checkoutSessionId: session.id,
    customerSnapshot: {
      name: details?.name ?? null,
      email: details?.email ?? session.customer_email ?? null,
      phone: phone || null,
    },
  });

  if (!upsert.ok) {
    return { handled: true };
  }

  await recordMembershipEvent(supabase, {
    businessId,
    membershipId: upsert.membershipId,
    eventType: 'checkout_completed',
    stripeEventId: event.id,
    stripeAccountId,
    summary: 'Membership checkout completed',
    payload: {
      sessionId: session.id,
      subscriptionId,
      status: subscription.status,
      planId,
      planPriceId,
    },
  });

  const meta = session.metadata ?? {};
  const bookingResult = await ensureMembershipInitialBooking(supabase, {
    membershipId: upsert.membershipId,
    visitFromSession: {
      firstVisitDate: meta.firstVisitDate ?? null,
      firstVisitTime: meta.firstVisitTime ?? null,
      visitDurationMinutes: meta.visitDurationMinutes ?? null,
    },
    customerSnapshot: {
      name: details?.name ?? null,
      email: details?.email ?? session.customer_email ?? null,
      phone: phone || null,
      street: meta.street ?? null,
      unit: meta.unit ?? null,
      city: meta.city ?? null,
      state: meta.state ?? null,
      zip: meta.zip ?? null,
      vehicleYear: meta.vehicleYear ?? null,
      vehicleMake: meta.vehicleMake ?? null,
      vehicleModel: meta.vehicleModel ?? null,
    },
    stripeCheckoutSessionId: session.id,
    requestId: event.id,
  });

  if (bookingResult.created) {
    await recordMembershipEvent(supabase, {
      businessId,
      membershipId: upsert.membershipId,
      eventType: 'initial_booking_created',
      stripeEventId: `${event.id}:initial_booking`,
      stripeAccountId,
      summary: 'First membership visit booked',
      payload: {
        sessionId: session.id,
        bookingId: bookingResult.bookingId,
      },
    });
  } else if (bookingResult.skippedReason) {
    logMemberships(event.id, 'warn', 'initial_booking.skipped', {
      membershipId: shortIdForLog(upsert.membershipId),
      reason: bookingResult.skippedReason,
      bookingId: bookingResult.bookingId
        ? shortIdForLog(bookingResult.bookingId)
        : undefined,
    });
  }

  void sendMembershipSubscribeConfirmedIfApplicable(
    supabase,
    upsert.membershipId
  ).catch(err => {
    logMemberships(event.id, 'error', 'confirm_email.unhandled', {
      membershipId: shortIdForLog(upsert.membershipId),
      reason: err instanceof Error ? err.message : 'unknown',
    });
  });

  return { handled: true };
}
