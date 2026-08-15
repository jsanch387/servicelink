import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  isMembershipCheckoutKind,
  mapMembershipInvoiceStatus,
  stripeIdFromExpandable,
  stripeSubscriptionIdFromInvoice,
  unixSecondsToIso,
} from './membershipStripeHelpers';
import {
  customerMembershipsOf,
  membershipInvoicesOf,
} from './membershipTablesQuery';
import { recordMembershipEvent } from './recordMembershipEvent';
import { sendMembershipInvoiceEmailIfApplicable } from './sendMembershipInvoiceEmailIfApplicable';
import { findMembershipByStripeSubscription } from './upsertCustomerMembershipFromSubscription';

function invoiceExpandableId(
  value: string | { id?: string } | null | undefined
): string | null {
  return stripeIdFromExpandable(value);
}

/**
 * Connect `invoice.paid` / `invoice.payment_failed` for memberships.
 * Returns `handled: false` when the invoice is not tied to a membership.
 */
export async function applyMembershipInvoiceEvent(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    invoice: Stripe.Invoice;
    kind: 'paid' | 'payment_failed';
  }
): Promise<{ handled: boolean }> {
  const { event, invoice } = args;
  const stripeAccountId =
    typeof event.account === 'string' ? event.account.trim() : '';
  if (!stripeAccountId) {
    return { handled: false };
  }

  const subscriptionId = stripeSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) {
    return { handled: false };
  }

  const invoiceWithSubMeta = invoice as Stripe.Invoice & {
    subscription_details?: { metadata?: Stripe.Metadata | null } | null;
  };
  const isMembershipMeta = isMembershipCheckoutKind(
    invoiceWithSubMeta.subscription_details?.metadata ?? invoice.metadata
  );

  const membership = await findMembershipByStripeSubscription(supabase, {
    stripeAccountId,
    stripeSubscriptionId: subscriptionId,
  });

  if (!membership && !isMembershipMeta) {
    return { handled: false };
  }

  if (!membership && isMembershipMeta) {
    // Checkout webhook may lag; still record invoice once membership exists later —
    // without a membership row we cannot satisfy FK. Skip quietly.
    logMemberships(event.id, 'warn', 'invoice.membership_not_found', {
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(subscriptionId),
      stripeInvoiceId: shortStripeIdForLog(invoice.id),
      reason: 'Membership row missing; invoice skipped until subscription sync',
    });
    return { handled: true };
  }

  if (!membership) {
    return { handled: false };
  }

  const status = mapMembershipInvoiceStatus(invoice.status);
  const amountDue =
    typeof invoice.amount_due === 'number'
      ? Math.max(0, Math.round(invoice.amount_due))
      : 0;
  const amountPaid =
    typeof invoice.amount_paid === 'number'
      ? Math.max(0, Math.round(invoice.amount_paid))
      : 0;
  const amountRemaining =
    typeof invoice.amount_remaining === 'number'
      ? Math.max(0, Math.round(invoice.amount_remaining))
      : 0;

  const lastError = invoice.last_finalization_error;
  // Prefer charge/payment_intent failure hints when present on payment_failed
  const paymentIntentRef = (
    invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }
  ).payment_intent;
  const chargeRef = (
    invoice as Stripe.Invoice & {
      charge?: string | Stripe.Charge | null;
    }
  ).charge;

  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  if (args.kind === 'payment_failed') {
    errorCode =
      (typeof lastError?.code === 'string' ? lastError.code : null) ||
      'payment_failed';
    errorMessage =
      typeof lastError?.message === 'string'
        ? lastError.message.slice(0, 200)
        : null;
  }

  const row = {
    business_id: membership.business_id,
    membership_id: membership.id,
    stripe_account_id: stripeAccountId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_payment_intent_id: invoiceExpandableId(paymentIntentRef),
    stripe_charge_id: invoiceExpandableId(chargeRef),
    stripe_customer_id: invoiceExpandableId(invoice.customer),
    status,
    billing_reason: invoice.billing_reason ?? null,
    currency: (invoice.currency ?? 'usd').trim().toLowerCase() || 'usd',
    amount_due_cents: amountDue,
    amount_paid_cents: amountPaid,
    amount_remaining_cents: amountRemaining,
    attempt_count:
      typeof invoice.attempt_count === 'number'
        ? Math.max(0, Math.round(invoice.attempt_count))
        : 0,
    period_start: unixSecondsToIso(invoice.period_start),
    period_end: unixSecondsToIso(invoice.period_end),
    paid_at: unixSecondsToIso(invoice.status_transitions?.paid_at),
    voided_at: unixSecondsToIso(invoice.status_transitions?.voided_at),
    finalized_at: unixSecondsToIso(invoice.status_transitions?.finalized_at),
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf: invoice.invoice_pdf ?? null,
    last_payment_error_code: errorCode,
    last_payment_error_message: errorMessage,
    metadata: {
      kind: 'membership_invoice',
      eventType: args.kind,
    } satisfies Json,
  };

  const { error: invoiceError } = await membershipInvoicesOf(supabase).upsert(
    row,
    { onConflict: 'stripe_account_id,stripe_invoice_id' }
  );

  if (invoiceError) {
    logMemberships(event.id, 'error', 'invoice.upsert_failed', {
      businessId: shortIdForLog(membership.business_id),
      membershipId: shortIdForLog(membership.id),
      stripeInvoiceId: shortStripeIdForLog(invoice.id),
      reason: 'membership_invoices upsert failed',
      ...supabaseErrorForLogs(invoiceError),
    });
    return { handled: true };
  }

  const membershipPatch: Record<string, unknown> = {
    last_invoice_status: status,
    latest_invoice_id: invoice.id,
  };
  if (args.kind === 'payment_failed') {
    membershipPatch.last_payment_failed_at = new Date().toISOString();
  } else if (args.kind === 'paid') {
    membershipPatch.last_payment_failed_at = null;
  }

  const { error: memberPatchError } = await customerMembershipsOf(supabase)
    .update(membershipPatch)
    .eq('id', membership.id);

  if (memberPatchError) {
    logMemberships(event.id, 'warn', 'invoice.member_health_patch_failed', {
      membershipId: shortIdForLog(membership.id),
      reason: 'customer_memberships payment health update failed',
      ...supabaseErrorForLogs(memberPatchError),
    });
  }

  await recordMembershipEvent(supabase, {
    businessId: membership.business_id,
    membershipId: membership.id,
    eventType: args.kind === 'paid' ? 'invoice_paid' : 'invoice_payment_failed',
    stripeEventId: event.id,
    stripeAccountId,
    summary:
      args.kind === 'paid'
        ? 'Membership invoice paid'
        : 'Membership invoice payment failed',
    payload: {
      invoiceId: invoice.id,
      subscriptionId,
      status,
      amountPaidCents: amountPaid,
      amountDueCents: amountDue,
    },
  });

  // First Checkout invoice already gets the subscribe-confirmed email — skip
  // duplicate "Payment received" for subscription_create. Always email failures.
  const billingReason = invoice.billing_reason ?? null;
  const skipPaidReceipt =
    args.kind === 'paid' && billingReason === 'subscription_create';

  if (!skipPaidReceipt) {
    try {
      await sendMembershipInvoiceEmailIfApplicable(supabase, {
        membershipId: membership.id,
        stripeAccountId,
        stripeInvoiceId: invoice.id,
        kind: args.kind,
        amountCents: args.kind === 'paid' ? amountPaid || amountDue : amountDue,
        periodStart: unixSecondsToIso(invoice.period_start),
        periodEnd: unixSecondsToIso(invoice.period_end),
        eventAtIso:
          args.kind === 'paid'
            ? unixSecondsToIso(invoice.status_transitions?.paid_at) ||
              new Date().toISOString()
            : new Date().toISOString(),
        stripeEventId: event.id,
      });
    } catch (err) {
      logMemberships(event.id, 'warn', 'invoice_email.unexpected', {
        membershipId: shortIdForLog(membership.id),
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return { handled: true };
}
