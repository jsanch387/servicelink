/**
 * Customer receipt / payment-failed email after membership invoice webhooks.
 * Idempotent via `membership_invoices.metadata.customer_email_sent_at`.
 */

import { API_ROUTES } from '@/constants/routes';
import {
  formatInvoiceDateLabel,
  formatInvoicePeriodLabel,
} from '@/features/email/membership-invoice/membershipInvoiceEmailShared';
import { sendMembershipInvoicePaidEmail } from '@/features/email/membership-invoice/sendMembershipInvoicePaidEmail';
import { sendMembershipInvoicePaymentFailedEmail } from '@/features/email/membership-invoice/sendMembershipInvoicePaymentFailedEmail';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCadenceOptionLabel } from '../utils/formatSubscriptionPrice';
import type { SubscriptionCadenceUnit } from '../types/customerSubscriptionPlan';
import { signMembershipManageToken } from './membershipManageToken';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  customerMembershipsOf,
  membershipInvoicesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

export async function sendMembershipInvoiceEmailIfApplicable(
  supabase: SupabaseClient<Database>,
  args: {
    membershipId: string;
    stripeAccountId: string;
    stripeInvoiceId: string;
    kind: 'paid' | 'payment_failed';
    amountCents: number;
    periodStart: string | null;
    periodEnd: string | null;
    eventAtIso: string | null;
    stripeEventId?: string;
    request?: Request;
  }
): Promise<void> {
  const membershipId = args.membershipId.trim();
  const stripeInvoiceId = args.stripeInvoiceId.trim();
  const stripeAccountId = args.stripeAccountId.trim();
  if (!membershipId || !stripeInvoiceId || !stripeAccountId) return;

  const admin = createSupabaseAdminClient();
  const eventId = args.stripeEventId?.trim() || undefined;

  const { data: invoiceRow, error: invoiceLoadErr } =
    await membershipInvoicesOf(admin)
      .select('id, metadata')
      .eq('stripe_account_id', stripeAccountId)
      .eq('stripe_invoice_id', stripeInvoiceId)
      .maybeSingle();

  if (invoiceLoadErr || !invoiceRow) {
    logMemberships(eventId, 'warn', 'invoice_email.invoice_missing', {
      membershipId: shortIdForLog(membershipId),
      stripeInvoiceId: shortStripeIdForLog(stripeInvoiceId),
      ...supabaseErrorForLogs(invoiceLoadErr),
    });
    return;
  }

  const invoiceMeta = (invoiceRow.metadata ?? {}) as Record<string, unknown>;
  if (
    typeof invoiceMeta.customer_email_sent_at === 'string' &&
    invoiceMeta.customer_email_sent_at.trim()
  ) {
    return;
  }

  const { data: membership, error: memberErr } = await customerMembershipsOf(
    admin
  )
    .select(
      'id, business_id, plan_id, customer_name, customer_email, interval_unit, interval_count, amount_cents'
    )
    .eq('id', membershipId)
    .maybeSingle();

  if (memberErr || !membership) {
    logMemberships(eventId, 'warn', 'invoice_email.membership_missing', {
      membershipId: shortIdForLog(membershipId),
      ...supabaseErrorForLogs(memberErr),
    });
    return;
  }

  const email = (membership.customer_email as string | null)?.trim();
  if (!email) {
    logMemberships(eventId, 'warn', 'invoice_email.no_email', {
      membershipId: shortIdForLog(membershipId),
    });
    return;
  }

  let planName = 'Your plan';
  if (membership.plan_id) {
    const { data: plan } = await membershipPlansOf(admin)
      .select('name')
      .eq('id', membership.plan_id as string)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', membership.business_id as string)
    .maybeSingle();

  const businessName =
    (
      business as { business_name?: string | null } | null
    )?.business_name?.trim() ||
    (
      business as { business_slug?: string | null } | null
    )?.business_slug?.trim() ||
    'Your membership';

  const intervalUnit = (
    typeof membership.interval_unit === 'string'
      ? membership.interval_unit
      : 'month'
  ) as SubscriptionCadenceUnit;
  const intervalCount =
    typeof membership.interval_count === 'number' &&
    membership.interval_count >= 1
      ? membership.interval_count
      : 1;

  const cadenceLabel = formatCadenceOptionLabel({
    intervalUnit,
    intervalCount,
  });

  const amountCents =
    args.amountCents > 0
      ? args.amountCents
      : Math.max(0, Math.round(Number(membership.amount_cents ?? 0)));

  const token = signMembershipManageToken(membershipId);
  const manageUrl = `${getAppBaseUrl(args.request)}${API_ROUTES.PUBLIC_MEMBERSHIPS_PORTAL}?token=${encodeURIComponent(token)}`;

  const payload = {
    businessName,
    customerName: (membership.customer_name as string | null)?.trim() || null,
    planName,
    cadenceLabel,
    amountCents,
    periodLabel: formatInvoicePeriodLabel(args.periodStart, args.periodEnd),
    eventDateLabel: formatInvoiceDateLabel(
      args.eventAtIso || new Date().toISOString()
    ),
    manageUrl,
  };

  const result =
    args.kind === 'paid'
      ? await sendMembershipInvoicePaidEmail(email, payload)
      : await sendMembershipInvoicePaymentFailedEmail(email, payload);

  if (!result.sent) {
    logMemberships(eventId, 'warn', 'invoice_email.send_failed', {
      membershipId: shortIdForLog(membershipId),
      kind: args.kind,
      reason: result.error,
    });
    return;
  }

  const nextMeta: Json = {
    ...invoiceMeta,
    customer_email_sent_at: new Date().toISOString(),
    customer_email_kind: args.kind,
  };

  const { error: patchErr } = await membershipInvoicesOf(admin)
    .update({ metadata: nextMeta })
    .eq('id', invoiceRow.id as string);

  if (patchErr) {
    logMemberships(eventId, 'warn', 'invoice_email.meta_failed', {
      membershipId: shortIdForLog(membershipId),
      ...supabaseErrorForLogs(patchErr),
    });
  } else {
    logMemberships(eventId, 'info', 'invoice_email.sent', {
      membershipId: shortIdForLog(membershipId),
      kind: args.kind,
      stripeInvoiceId: shortStripeIdForLog(stripeInvoiceId),
    });
  }
}
