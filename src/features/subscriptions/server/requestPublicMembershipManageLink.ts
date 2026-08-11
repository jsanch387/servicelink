import { API_ROUTES } from '@/constants/routes';
import { isValidEmail } from '@/features/auth/utils/validation';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { normalizeEmailForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import { sendMembershipManageLinkEmail } from '@/features/email/membership-manage-link/sendMembershipManageLinkEmail';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { NextRequest } from 'next/server';
import { isBusinessInMembershipsRollout } from './isBusinessInMembershipsRollout';
import { signMembershipManageToken } from './membershipManageToken';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';

/** Statuses that may still open Customer Portal (incl. canceled for receipts). */
const MANAGEABLE_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'canceled',
] as const;

export type RequestPublicMembershipManageLinkResult = {
  /** Always true for valid requests — does not reveal whether a membership exists. */
  ok: true;
};

/**
 * Public “email me a manage link”.
 * Always returns ok for valid input (anti-enumeration). Sends only when a match exists.
 */
export async function requestPublicMembershipManageLink(
  request: NextRequest,
  input: { businessSlug: string; email: string },
  requestId?: string
): Promise<
  | RequestPublicMembershipManageLinkResult
  | { ok: false; error: string; status: number }
> {
  const businessSlug = input.businessSlug.trim().toLowerCase();
  const emailRaw = input.email.trim();

  if (!businessSlug) {
    return { ok: false, status: 400, error: 'Business is required.' };
  }
  if (!emailRaw || !isValidEmail(emailRaw)) {
    return { ok: false, status: 400, error: 'Enter a valid email.' };
  }

  const emailNormalized = normalizeEmailForLookup(emailRaw);
  const supabase = createSupabaseAdminClient();

  if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
    // Same generic success path — don’t leak business existence via this form.
    return { ok: true };
  }

  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .eq('business_slug', businessSlug)
    .maybeSingle();

  if (profileError) {
    logMemberships(requestId, 'error', 'manage_link.business_load_failed', {
      reason: 'Could not load business profile',
      ...supabaseErrorForLogs(profileError),
    });
    return { ok: true };
  }

  const businessId = String(
    (profile as { id?: string } | null)?.id ?? ''
  ).trim();
  const businessName =
    (
      profile as { business_name?: string | null } | null
    )?.business_name?.trim() || 'Your membership';

  if (!businessId) {
    return { ok: true };
  }

  if (!(await isBusinessInMembershipsRollout(supabase, businessId))) {
    return { ok: true };
  }

  const { data: row, error: membershipError } = await customerMembershipsOf(
    supabase
  )
    .select(
      'id, plan_id, customer_name, customer_email, status, stripe_customer_id'
    )
    .eq('business_id', businessId)
    .eq('customer_email_normalized', emailNormalized)
    .in('status', [...MANAGEABLE_STATUSES])
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    logMemberships(requestId, 'error', 'manage_link.lookup_failed', {
      businessId: shortIdForLog(businessId),
      ...supabaseErrorForLogs(membershipError),
    });
    return { ok: true };
  }

  if (!row?.id) {
    logMemberships(requestId, 'info', 'manage_link.no_match', {
      businessId: shortIdForLog(businessId),
    });
    return { ok: true };
  }

  let planName = 'Your plan';
  if (row.plan_id) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name')
      .eq('id', row.plan_id)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const membershipId = String(row.id);
  const token = signMembershipManageToken(membershipId);
  const baseUrl = getAppBaseUrl(request);
  const manageUrl = `${baseUrl}${API_ROUTES.PUBLIC_MEMBERSHIPS_PORTAL}?token=${encodeURIComponent(token)}`;

  const to =
    (typeof row.customer_email === 'string' && row.customer_email.trim()) ||
    emailRaw;

  const result = await sendMembershipManageLinkEmail(to, {
    businessName,
    customerName:
      typeof row.customer_name === 'string' ? row.customer_name : null,
    planName,
    manageUrl,
  });

  if (!result.sent) {
    logMemberships(requestId, 'error', 'manage_link.send_failed', {
      membershipId: shortIdForLog(membershipId),
      reason: result.error,
    });
    // Still generic — don’t tip off whether the address matched.
    return { ok: true };
  }

  logMemberships(requestId, 'info', 'manage_link.sent', {
    membershipId: shortIdForLog(membershipId),
    businessId: shortIdForLog(businessId),
  });

  return { ok: true };
}
