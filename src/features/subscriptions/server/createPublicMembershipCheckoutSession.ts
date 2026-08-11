import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { NextRequest } from 'next/server';
import { isBusinessInMembershipsRollout } from './isBusinessInMembershipsRollout';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

type PlanRow = {
  id: string;
  business_id: string;
  name: string;
  deleted_at: string | null;
  is_published: boolean;
};

type PriceRow = {
  id: string;
  plan_id: string;
  business_id: string;
  stripe_price_id: string | null;
  currency: string;
};

export type CreatePublicMembershipCheckoutInput = {
  businessSlug: string;
  planId: string;
  priceId: string;
};

export type CreatePublicMembershipCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string; status: number };

function encodeSlugPath(slug: string): string {
  return encodeURIComponent(slug.trim().toLowerCase());
}

/**
 * Public booking-link Continue → Stripe Checkout (`mode: 'subscription'`)
 * on the business connected account. No webhook / member row yet.
 */
export async function createPublicMembershipCheckoutSession(
  request: NextRequest,
  input: CreatePublicMembershipCheckoutInput,
  requestId?: string
): Promise<CreatePublicMembershipCheckoutResult> {
  const businessSlug = input.businessSlug.trim().toLowerCase();
  const planId = input.planId.trim();
  const priceId = input.priceId.trim();

  if (!businessSlug || !planId || !priceId) {
    return {
      ok: false,
      status: 400,
      error: 'Business, plan, and pricing option are required.',
    };
  }

  const supabase = createSupabaseAdminClient();

  if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
    return { ok: false, status: 404, error: 'Business not found.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_slug', businessSlug)
    .maybeSingle();

  if (profileError) {
    logMemberships(requestId, 'error', 'checkout.business_load_failed', {
      reason: 'Could not load business profile',
      ...supabaseErrorForLogs(profileError),
    });
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  const businessId = String(
    (profile as { id?: string } | null)?.id ?? ''
  ).trim();
  if (!businessId) {
    return { ok: false, status: 404, error: 'Business not found.' };
  }

  const inRollout = await isBusinessInMembershipsRollout(supabase, businessId);
  if (!inRollout) {
    logMemberships(requestId, 'warn', 'checkout.not_in_rollout', {
      businessId: shortIdForLog(businessId),
      reason: 'Business not in memberships rollout',
    });
    return {
      ok: false,
      status: 403,
      error: 'Subscriptions are not available for this business.',
    };
  }

  const hasPro = await ownerHasProAccessForBusiness(supabase, businessId);
  if (!hasPro) {
    logMemberships(requestId, 'warn', 'checkout.not_pro', {
      businessId: shortIdForLog(businessId),
      reason: 'Owner is not Pro',
    });
    return {
      ok: false,
      status: 403,
      error: 'Subscriptions are not available for this business.',
    };
  }

  const { data: settingsRow, error: settingsError } = await paymentSettingsOf(
    supabase
  )
    .select('payments_enabled')
    .eq('business_id', businessId)
    .maybeSingle();

  if (settingsError) {
    logMemberships(requestId, 'error', 'checkout.settings_load_failed', {
      businessId: shortIdForLog(businessId),
      reason: 'Could not load payment settings',
      ...supabaseErrorForLogs(settingsError),
    });
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  if (settingsRow?.payments_enabled !== true) {
    logMemberships(requestId, 'warn', 'checkout.payments_disabled', {
      businessId: shortIdForLog(businessId),
      reason: 'ServiceLink payments not enabled',
    });
    return {
      ok: false,
      status: 400,
      error: 'Online payments are not enabled for this business.',
    };
  }

  const { data: accountRow, error: accountError } = await paymentAccountsOf(
    supabase
  )
    .select('stripe_account_id, charges_enabled, onboarding_status')
    .eq('business_id', businessId)
    .maybeSingle();

  if (accountError) {
    logMemberships(requestId, 'error', 'checkout.account_load_failed', {
      businessId: shortIdForLog(businessId),
      reason: 'Could not load Stripe account',
      ...supabaseErrorForLogs(accountError),
    });
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  const stripeAccountId = String(accountRow?.stripe_account_id ?? '').trim();
  if (
    !stripeAccountId ||
    accountRow?.onboarding_status !== 'complete' ||
    accountRow?.charges_enabled !== true
  ) {
    logMemberships(requestId, 'warn', 'checkout.connect_not_ready', {
      businessId: shortIdForLog(businessId),
      reason: 'Connect account not ready for charges',
    });
    return {
      ok: false,
      status: 400,
      error:
        'This business cannot accept card payments yet. Finish Stripe setup first.',
    };
  }

  const { data: planData, error: planError } = await membershipPlansOf(supabase)
    .select('id, business_id, name, deleted_at, is_published')
    .eq('id', planId)
    .eq('business_id', businessId)
    .maybeSingle();

  const plan = planData as PlanRow | null;
  if (planError) {
    logMemberships(requestId, 'error', 'checkout.plan_load_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      reason: 'Could not load plan',
      ...supabaseErrorForLogs(planError),
    });
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  if (!plan || plan.deleted_at || !plan.is_published) {
    return {
      ok: false,
      status: 404,
      error: 'This plan is no longer available.',
    };
  }

  const { data: priceData, error: priceError } = await membershipPlanPricesOf(
    supabase
  )
    .select('id, plan_id, business_id, stripe_price_id, currency')
    .eq('id', priceId)
    .eq('plan_id', planId)
    .eq('business_id', businessId)
    .maybeSingle();

  const price = priceData as PriceRow | null;
  if (priceError) {
    logMemberships(requestId, 'error', 'checkout.price_load_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      priceId: shortIdForLog(priceId),
      reason: 'Could not load pricing option',
      ...supabaseErrorForLogs(priceError),
    });
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  const stripePriceId = price?.stripe_price_id?.trim() ?? '';
  if (!price || !stripePriceId) {
    logMemberships(requestId, 'warn', 'checkout.missing_stripe_price', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      priceId: shortIdForLog(priceId),
      reason: 'Pricing option has no Stripe Price id',
    });
    return {
      ok: false,
      status: 400,
      error: 'This plan is not ready for checkout yet.',
    };
  }

  const baseUrl = getAppBaseUrl(request);
  const slugPath = encodeSlugPath(businessSlug);
  const successUrl = `${baseUrl}/${slugPath}?membershipCheckout=success&planId=${encodeURIComponent(planId)}&priceId=${encodeURIComponent(priceId)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/${slugPath}?membershipCheckout=cancel`;

  const stripe = getStripePlatform();
  const meta = {
    kind: 'membership_checkout',
    businessId,
    businessSlug,
    membershipPlanId: plan.id,
    membershipPlanPriceId: price.id,
  };

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        phone_number_collection: { enabled: true },
        metadata: meta,
        subscription_data: {
          metadata: meta,
        },
      },
      { stripeAccount: stripeAccountId }
    );

    if (!session.url) {
      logMemberships(requestId, 'error', 'checkout.no_session_url', {
        businessId: shortIdForLog(businessId),
        planId: shortIdForLog(planId),
        sessionId: shortStripeIdForLog(session.id),
        reason: 'Stripe session created without url',
      });
      return {
        ok: false,
        status: 502,
        error: 'Stripe did not return a checkout URL.',
      };
    }

    return {
      ok: true,
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    logMemberships(requestId, 'error', 'checkout.stripe_session_failed', {
      businessId: shortIdForLog(businessId),
      planId: shortIdForLog(planId),
      priceId: shortIdForLog(priceId),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripePriceId: shortStripeIdForLog(stripePriceId),
      reason: 'Stripe Checkout session create failed',
      ...stripeErrorForLogs(error),
    });
    return {
      ok: false,
      status: 502,
      error: userFacingStripeConnectCheckoutError(error),
    };
  }
}
