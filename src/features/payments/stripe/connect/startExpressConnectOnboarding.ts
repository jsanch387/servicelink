import { ROUTES } from '@/constants/routes';
import { logConnect } from '@/features/payments/server/connectOnboardingLog';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import type { NextRequest } from 'next/server';
import { getDefaultConnectAccountCountry } from './constants';

/** Minimal auth context needed to stamp Connect metadata. */
export type ConnectOnboardingUserContext = {
  id: string;
  email: string | undefined;
};

export type StartExpressConnectOnboardingParams = {
  request: NextRequest;
  user: ConnectOnboardingUserContext;
  /** Owning business row in Supabase (`business_profiles.id`). */
  businessId: string;
  /**
   * When set, reuse this Connect account and only mint a new Account Link
   * (resume after abandon or expired link).
   */
  existingStripeAccountId?: string | null;
  /**
   * Stripe Account Link `return_url` / `refresh_url` (e.g. mobile deep links).
   * Omit to use `{site}/dashboard/payments?connect=return|refresh` (web).
   */
  accountLinkUrls?: {
    returnUrl: string;
    refreshUrl: string;
  };
};

export type StartExpressConnectOnboardingResult = {
  url: string;
  stripeAccountId: string;
  /** False when reusing `existingStripeAccountId` (no `accounts.create`). */
  createdNewStripeAccount: boolean;
};

/**
 * Opens Stripe-hosted Connect Express onboarding: creates a Connect account once
 * per business, then always uses **Account Links** for first visit and resume.
 */
export async function startExpressConnectOnboarding(
  params: StartExpressConnectOnboardingParams
): Promise<StartExpressConnectOnboardingResult> {
  const stripe = getStripePlatform();
  const baseUrl = getAppBaseUrl(params.request);
  const customReturn = params.accountLinkUrls?.returnUrl?.trim();
  const customRefresh = params.accountLinkUrls?.refreshUrl?.trim();
  const returnUrl =
    customReturn && customRefresh
      ? customReturn
      : `${baseUrl}${ROUTES.DASHBOARD.PAYMENTS}?connect=return`;
  const refreshUrl =
    customReturn && customRefresh
      ? customRefresh
      : `${baseUrl}${ROUTES.DASHBOARD.PAYMENTS}?connect=refresh`;

  const existingId = params.existingStripeAccountId?.trim() || null;

  let stripeAccountId: string;
  let createdNewStripeAccount: boolean;

  if (existingId) {
    stripeAccountId = existingId;
    createdNewStripeAccount = false;
    logConnect('stripe.reuse_account', {
      businessId: params.businessId,
      stripeAccountId,
    });
  } else {
    const account = await stripe.accounts.create({
      type: 'express',
      country: getDefaultConnectAccountCountry(),
      email: params.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        supabase_user_id: params.user.id,
        business_id: params.businessId,
      },
    });
    stripeAccountId = account.id;
    createdNewStripeAccount = true;
    logConnect('stripe.account_created', {
      businessId: params.businessId,
      stripeAccountId,
      country: getDefaultConnectAccountCountry(),
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  if (!accountLink.url) {
    throw new Error('Stripe did not return an onboarding URL');
  }

  logConnect('stripe.account_link_created', {
    businessId: params.businessId,
    stripeAccountId,
    returnKind: customReturn && customRefresh ? 'mobile_env' : 'web_dashboard',
  });

  return {
    url: accountLink.url,
    stripeAccountId,
    createdNewStripeAccount,
  };
}
