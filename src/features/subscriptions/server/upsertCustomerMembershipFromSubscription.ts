import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
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
  invoiceHealthFromStripeInvoice,
  latestInvoiceFromSubscription,
  paymentMethodSnapshotFromStripe,
  type MembershipPaymentMethodSnapshot,
} from './membershipPaymentMethodSnapshot';
import {
  mapMembershipSubscriptionStatus,
  membershipBillingSnapshot,
  membershipSubscriptionPeriodBounds,
  stripeIdFromExpandable,
  unixSecondsToIso,
} from './membershipStripeHelpers';
import { customerMembershipsOf } from './membershipTablesQuery';

export type MembershipCustomerSnapshot = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Upsert `customer_memberships` from a Connect Stripe Subscription (+ optional checkout snapshot).
 * Null plan / customer snapshot fields preserve existing row values on update.
 */
export async function upsertCustomerMembershipFromSubscription(
  supabase: SupabaseClient<Database>,
  args: {
    stripeAccountId: string;
    subscription: Stripe.Subscription;
    businessId: string;
    planId?: string | null;
    planPriceId?: string | null;
    checkoutSessionId?: string | null;
    customerSnapshot?: MembershipCustomerSnapshot | null;
    /** Override when expanded PaymentMethod was retrieved separately. */
    paymentMethod?: MembershipPaymentMethodSnapshot | null;
    /** Merge into metadata jsonb (ids only — no PII). */
    extraMetadata?: Record<string, string> | null;
  }
): Promise<{ ok: true; membershipId: string } | { ok: false; error: string }> {
  const stripeAccountId = args.stripeAccountId.trim();
  const subscriptionId = args.subscription.id?.trim();
  if (!stripeAccountId || !subscriptionId) {
    return { ok: false, error: 'Missing Stripe account or subscription id' };
  }

  const businessId = args.businessId.trim();
  if (!businessId) {
    return { ok: false, error: 'Missing business id' };
  }

  const { data: existing } = await customerMembershipsOf(supabase)
    .select(
      'id, plan_id, plan_price_id, customer_name, customer_email, customer_phone, customer_email_normalized, customer_phone_normalized, stripe_checkout_session_id, payment_method_brand, payment_method_last4, last_invoice_status, latest_invoice_id, metadata'
    )
    .eq('stripe_account_id', stripeAccountId)
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  const billing = membershipBillingSnapshot(args.subscription);
  const periods = membershipSubscriptionPeriodBounds(args.subscription);
  const status = mapMembershipSubscriptionStatus(args.subscription.status);

  const emailRaw = args.customerSnapshot?.email?.trim() || null;
  const phoneRaw = args.customerSnapshot?.phone?.trim() || null;
  const nameRaw = args.customerSnapshot?.name?.trim() || null;

  const pmFromSub = paymentMethodSnapshotFromStripe(
    args.subscription.default_payment_method
  );
  const pm = args.paymentMethod ?? pmFromSub;
  const invoiceHealth = invoiceHealthFromStripeInvoice(
    latestInvoiceFromSubscription(args.subscription)
  );

  const metaFromSub = args.subscription.metadata ?? {};
  const existingMeta =
    existing?.metadata &&
    typeof existing.metadata === 'object' &&
    !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};
  const metadata: Json = {
    ...existingMeta,
    kind: 'membership_checkout',
    ...(typeof metaFromSub.businessSlug === 'string'
      ? { businessSlug: metaFromSub.businessSlug }
      : {}),
    ...(typeof metaFromSub.firstVisitDate === 'string'
      ? { firstVisitDate: metaFromSub.firstVisitDate }
      : {}),
    ...(typeof metaFromSub.firstVisitTime === 'string'
      ? { firstVisitTime: metaFromSub.firstVisitTime }
      : {}),
    ...(typeof metaFromSub.visitDurationMinutes === 'string'
      ? { visitDurationMinutes: metaFromSub.visitDurationMinutes }
      : {}),
    ...(args.extraMetadata ?? {}),
  };

  const row = {
    business_id: businessId,
    plan_id: args.planId?.trim() || existing?.plan_id || null,
    plan_price_id: args.planPriceId?.trim() || existing?.plan_price_id || null,
    customer_name: nameRaw || existing?.customer_name || null,
    customer_email: emailRaw || existing?.customer_email || null,
    customer_phone: phoneRaw || existing?.customer_phone || null,
    customer_email_normalized: emailRaw
      ? normalizeEmailForLookup(emailRaw)
      : existing?.customer_email_normalized || null,
    customer_phone_normalized: phoneRaw
      ? normalizePhoneForLookup(phoneRaw)
      : existing?.customer_phone_normalized || null,
    stripe_account_id: stripeAccountId,
    stripe_customer_id: stripeIdFromExpandable(args.subscription.customer),
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id:
      args.checkoutSessionId?.trim() ||
      existing?.stripe_checkout_session_id ||
      null,
    status,
    currency: billing.currency,
    amount_cents: billing.amountCents,
    interval_unit: billing.intervalUnit,
    interval_count: billing.intervalCount,
    current_period_start: unixSecondsToIso(periods.startUnix),
    current_period_end: unixSecondsToIso(periods.endUnix),
    cancel_at_period_end: Boolean(args.subscription.cancel_at_period_end),
    cancel_at: unixSecondsToIso(args.subscription.cancel_at),
    canceled_at: unixSecondsToIso(args.subscription.canceled_at),
    ended_at: unixSecondsToIso(args.subscription.ended_at),
    trial_end: unixSecondsToIso(args.subscription.trial_end),
    last_invoice_status:
      invoiceHealth.lastInvoiceStatus || existing?.last_invoice_status || null,
    latest_invoice_id:
      invoiceHealth.latestInvoiceId || existing?.latest_invoice_id || null,
    payment_method_brand: pm.brand || existing?.payment_method_brand || null,
    payment_method_last4: pm.last4 || existing?.payment_method_last4 || null,
    metadata,
  };

  const { data, error } = await customerMembershipsOf(supabase)
    .upsert(row, {
      onConflict: 'stripe_account_id,stripe_subscription_id',
    })
    .select('id')
    .maybeSingle();

  if (error || !data?.id) {
    logMemberships(undefined, 'error', 'membership.upsert_failed', {
      businessId: shortIdForLog(businessId),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(subscriptionId),
      reason: 'customer_memberships upsert failed',
      ...supabaseErrorForLogs(error),
    });
    return { ok: false, error: error?.message ?? 'Upsert returned no id' };
  }

  return { ok: true, membershipId: String(data.id) };
}

/** Lookup membership by Connect subscription id (for lifecycle events without checkout metadata). */
export async function findMembershipByStripeSubscription(
  supabase: SupabaseClient<Database>,
  args: { stripeAccountId: string; stripeSubscriptionId: string }
): Promise<{ id: string; business_id: string } | null> {
  const accountId = args.stripeAccountId.trim();
  const subId = args.stripeSubscriptionId.trim();
  if (!accountId || !subId) return null;

  const { data, error } = await customerMembershipsOf(supabase)
    .select('id, business_id')
    .eq('stripe_account_id', accountId)
    .eq('stripe_subscription_id', subId)
    .maybeSingle();

  if (error || !data?.id) return null;
  return { id: String(data.id), business_id: String(data.business_id) };
}
