import { API_ROUTES } from '@/constants/routes';
import { sendMembershipSubscribeConfirmedEmail } from '@/features/email/membership-subscribe-confirmed/sendMembershipSubscribeConfirmedEmail';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { mapCustomerMembershipToOwnerSubscriber } from './mapCustomerMembershipToOwnerSubscriber';
import { signMembershipManageToken } from './membershipManageToken';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';

/**
 * Best-effort customer confirmation after membership checkout.
 * Idempotent via `metadata.confirmation_email_sent_at`.
 */
export async function sendMembershipSubscribeConfirmedIfApplicable(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  request?: Request
): Promise<void> {
  const mid = membershipId.trim();
  if (!mid) return;

  const admin = createSupabaseAdminClient();
  const { data: row, error } = await customerMembershipsOf(admin)
    .select('*')
    .eq('id', mid)
    .maybeSingle();

  if (error || !row) {
    logMemberships(undefined, 'warn', 'confirm_email.membership_missing', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(error),
    });
    return;
  }

  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  if (
    typeof meta.confirmation_email_sent_at === 'string' &&
    meta.confirmation_email_sent_at.trim()
  ) {
    return;
  }

  const email = row.customer_email?.trim();
  if (!email) {
    logMemberships(undefined, 'warn', 'confirm_email.no_email', {
      membershipId: shortIdForLog(mid),
      reason: 'Membership has no customer email',
    });
    return;
  }

  let planName = 'Your plan';
  if (row.plan_id) {
    const { data: plan } = await membershipPlansOf(admin)
      .select('name')
      .eq('id', row.plan_id)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', row.business_id)
    .maybeSingle();

  const businessName =
    (
      business as { business_name?: string | null } | null
    )?.business_name?.trim() || 'Your membership';
  const slug =
    (
      business as { business_slug?: string | null } | null
    )?.business_slug?.trim() ||
    (typeof meta.businessSlug === 'string' ? meta.businessSlug.trim() : '');

  const mapped = mapCustomerMembershipToOwnerSubscriber(row, planName);
  const token = signMembershipManageToken(mid);
  const baseUrl = getAppBaseUrl(request);
  const manageUrl = `${baseUrl}${API_ROUTES.PUBLIC_MEMBERSHIPS_PORTAL}?token=${encodeURIComponent(token)}`;

  const result = await sendMembershipSubscribeConfirmedEmail(email, {
    businessName,
    customerName: row.customer_name?.trim() || null,
    planName,
    cadenceLabel: mapped.cadenceLabel,
    amountCents: mapped.amountCents,
    manageUrl,
  });

  if (!result.sent) {
    logMemberships(undefined, 'error', 'confirm_email.send_failed', {
      membershipId: shortIdForLog(mid),
      reason: result.error,
      businessSlug: slug || undefined,
    });
    return;
  }

  const nextMeta: Json = {
    ...meta,
    confirmation_email_sent_at: new Date().toISOString(),
    ...(slug ? { businessSlug: slug } : {}),
  };

  const { error: patchError } = await customerMembershipsOf(admin)
    .update({ metadata: nextMeta })
    .eq('id', mid);

  if (patchError) {
    logMemberships(undefined, 'warn', 'confirm_email.mark_sent_failed', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(patchError),
    });
  }
}
