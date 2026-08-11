import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import { getStripeConnectClient } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  invoiceHealthFromStripeInvoice,
  paymentMethodSnapshotFromStripe,
} from './membershipPaymentMethodSnapshot';
import {
  mapMembershipInvoiceStatus,
  stripeIdFromExpandable,
  unixSecondsToIso,
} from './membershipStripeHelpers';
import {
  customerMembershipsOf,
  membershipInvoicesOf,
} from './membershipTablesQuery';

type MembershipRow =
  Database['public']['Tables']['customer_memberships']['Row'];

async function upsertInvoiceSnapshotFromStripe(
  admin: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    stripeAccountId: string;
    invoice: Stripe.Invoice;
  }
): Promise<void> {
  const invoice = args.invoice;
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

  const { error } = await membershipInvoicesOf(admin).upsert(
    {
      business_id: args.businessId,
      membership_id: args.membershipId,
      stripe_account_id: args.stripeAccountId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: stripeIdFromExpandable(
        (
          invoice as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          }
        ).subscription
      ),
      stripe_payment_intent_id: stripeIdFromExpandable(paymentIntentRef),
      stripe_charge_id: stripeIdFromExpandable(chargeRef),
      stripe_customer_id: stripeIdFromExpandable(invoice.customer),
      status: mapMembershipInvoiceStatus(invoice.status),
      billing_reason: invoice.billing_reason ?? null,
      currency: (invoice.currency ?? 'usd').trim().toLowerCase() || 'usd',
      amount_due_cents:
        typeof invoice.amount_due === 'number'
          ? Math.max(0, Math.round(invoice.amount_due))
          : 0,
      amount_paid_cents:
        typeof invoice.amount_paid === 'number'
          ? Math.max(0, Math.round(invoice.amount_paid))
          : 0,
      amount_remaining_cents:
        typeof invoice.amount_remaining === 'number'
          ? Math.max(0, Math.round(invoice.amount_remaining))
          : 0,
      attempt_count:
        typeof invoice.attempt_count === 'number'
          ? Math.max(0, Math.round(invoice.attempt_count))
          : 0,
      period_start: unixSecondsToIso(invoice.period_start),
      period_end: unixSecondsToIso(invoice.period_end),
      paid_at: unixSecondsToIso(invoice.status_transitions?.paid_at),
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
      metadata: { kind: 'membership_invoice', source: 'enrich' },
    },
    { onConflict: 'stripe_account_id,stripe_invoice_id' }
  );

  if (error) {
    logMemberships(undefined, 'warn', 'enrich.invoice_upsert_failed', {
      membershipId: shortIdForLog(args.membershipId),
      ...supabaseErrorForLogs(error),
    });
  }
}

/**
 * Best-effort backfill of phone / card / last invoice from Connect Stripe
 * when owner opens subscriber detail (covers members created before we stored them).
 */
export async function enrichOwnerMembershipFromStripe(
  _supabase: SupabaseClient<Database>,
  row: MembershipRow
): Promise<MembershipRow> {
  const stripeAccountId = row.stripe_account_id?.trim() ?? '';
  const subscriptionId = row.stripe_subscription_id?.trim() ?? '';
  if (!stripeAccountId || !subscriptionId) return row;

  const needsPhone = !row.customer_phone?.trim();
  const needsCard =
    !row.payment_method_brand?.trim() || !row.payment_method_last4?.trim();
  const needsInvoice = !row.last_invoice_status?.trim();

  if (!needsPhone && !needsCard && !needsInvoice) return row;

  const admin = createSupabaseAdminClient();

  try {
    const stripe = getStripeConnectClient(stripeAccountId);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    });

    const patch: Record<string, unknown> = {};
    const pm = paymentMethodSnapshotFromStripe(
      subscription.default_payment_method
    );
    if (needsCard && (pm.brand || pm.last4)) {
      patch.payment_method_brand = pm.brand;
      patch.payment_method_last4 = pm.last4;
    }

    const latestInvoice = subscription.latest_invoice;
    const invoiceHealth = invoiceHealthFromStripeInvoice(latestInvoice);
    if (needsInvoice && invoiceHealth.lastInvoiceStatus) {
      patch.last_invoice_status = invoiceHealth.lastInvoiceStatus;
      patch.latest_invoice_id = invoiceHealth.latestInvoiceId;
    }

    if (
      latestInvoice &&
      typeof latestInvoice !== 'string' &&
      latestInvoice.id
    ) {
      await upsertInvoiceSnapshotFromStripe(admin, {
        businessId: row.business_id,
        membershipId: row.id,
        stripeAccountId,
        invoice: latestInvoice,
      });
    }

    if (needsPhone) {
      const customerId = stripeIdFromExpandable(subscription.customer);
      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) {
          const phone = customer.phone?.trim();
          if (phone) {
            patch.customer_phone = phone;
            patch.customer_phone_normalized = normalizePhoneForLookup(phone);
          }
          if (!row.customer_email?.trim() && customer.email?.trim()) {
            const email = customer.email.trim();
            patch.customer_email = email;
            patch.customer_email_normalized = normalizeEmailForLookup(email);
          }
          if (!row.customer_name?.trim() && customer.name?.trim()) {
            patch.customer_name = customer.name.trim();
          }
        }
      }
    }

    const items = subscription.items?.data ?? [];
    if (items.length > 0) {
      patch.current_period_end = unixSecondsToIso(
        Math.max(...items.map(i => i.current_period_end))
      );
      patch.current_period_start = unixSecondsToIso(
        Math.min(...items.map(i => i.current_period_start))
      );
    }
    patch.cancel_at_period_end = Boolean(subscription.cancel_at_period_end);
    patch.cancel_at = unixSecondsToIso(subscription.cancel_at);
    patch.canceled_at = unixSecondsToIso(subscription.canceled_at);
    patch.ended_at = unixSecondsToIso(subscription.ended_at);
    if (subscription.status) patch.status = subscription.status;

    if (Object.keys(patch).length === 0) return row;

    const { data: updated, error } = await customerMembershipsOf(admin)
      .update(patch)
      .eq('id', row.id)
      .select('*')
      .maybeSingle();

    if (error || !updated) {
      logMemberships(undefined, 'warn', 'enrich.patch_failed', {
        membershipId: shortIdForLog(row.id),
        ...supabaseErrorForLogs(error),
      });
      return row;
    }
    return updated as MembershipRow;
  } catch (err) {
    logMemberships(undefined, 'warn', 'enrich.stripe_failed', {
      membershipId: shortIdForLog(row.id),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(subscriptionId),
      ...stripeErrorForLogs(err),
    });
    return row;
  }
}
