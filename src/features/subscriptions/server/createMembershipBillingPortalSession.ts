import { getAppBaseUrl, getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
} from './membershipsTransactionLog';
import { customerMembershipsOf } from './membershipTablesQuery';

export async function createMembershipBillingPortalSession(
  supabase: SupabaseClient<Database>,
  args: {
    membershipId: string;
    request?: Request;
    /** Optional override return path (defaults to business booking slug). */
    returnPath?: string | null;
  }
): Promise<
  { ok: true; url: string } | { ok: false; error: string; status: number }
> {
  const membershipId = args.membershipId.trim();
  if (!membershipId) {
    return { ok: false, error: 'Missing membership id.', status: 400 };
  }

  const { data: row, error } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, stripe_account_id, stripe_customer_id, status, metadata'
    )
    .eq('id', membershipId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: 'Membership not found.', status: 404 };
  }

  const stripeAccountId = String(row.stripe_account_id ?? '').trim();
  const stripeCustomerId = String(row.stripe_customer_id ?? '').trim();
  if (!stripeAccountId || !stripeCustomerId) {
    return {
      ok: false,
      error: 'Billing portal is not available for this membership yet.',
      status: 400,
    };
  }

  let returnPath = args.returnPath?.trim() || '';
  if (!returnPath) {
    const meta = row.metadata as { businessSlug?: unknown } | null;
    const slug =
      typeof meta?.businessSlug === 'string' ? meta.businessSlug.trim() : '';
    if (slug) {
      returnPath = `/${encodeURIComponent(slug)}`;
    } else {
      const { data: bp } = await supabase
        .from('business_profiles')
        .select('business_slug')
        .eq('id', row.business_id)
        .maybeSingle();
      const businessSlug = (
        bp as { business_slug?: string | null } | null
      )?.business_slug?.trim();
      returnPath = businessSlug ? `/${encodeURIComponent(businessSlug)}` : '/';
    }
  }

  const baseUrl = getAppBaseUrl(args.request);
  const returnUrl = `${baseUrl}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;

  try {
    const stripe = getStripeConnectClient(stripeAccountId);
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    if (!session.url) {
      return {
        ok: false,
        error: 'Stripe did not return a portal URL.',
        status: 502,
      };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    logMemberships(undefined, 'error', 'portal.session_failed', {
      membershipId: shortIdForLog(membershipId),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeCustomerId: shortStripeIdForLog(stripeCustomerId),
      reason: 'Connect billing portal session create failed',
      ...stripeErrorForLogs(err),
    });
    return {
      ok: false,
      error:
        'Could not open the billing portal. The connected account may need Customer Portal enabled in Stripe.',
      status: 502,
    };
  }
}
