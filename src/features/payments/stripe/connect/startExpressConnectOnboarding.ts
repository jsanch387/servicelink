import { ROUTES } from '@/constants/routes';
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
};

export type StartExpressConnectOnboardingResult = {
  url: string;
  stripeAccountId: string;
};

/**
 * Creates a Stripe Connect **Express** account and an **account_onboarding** link.
 * Ephemeral MVP: does not persist `acct_…` in app DB (see route TODO).
 */
export async function startExpressConnectOnboarding(
  params: StartExpressConnectOnboardingParams
): Promise<StartExpressConnectOnboardingResult> {
  const stripe = getStripePlatform();
  const baseUrl = getAppBaseUrl(params.request);
  const returnUrl = `${baseUrl}${ROUTES.DASHBOARD.PAYMENTS}?connect=return`;
  const refreshUrl = `${baseUrl}${ROUTES.DASHBOARD.PAYMENTS}?connect=refresh`;

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
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  if (!accountLink.url) {
    throw new Error('Stripe did not return an onboarding URL');
  }

  return { url: accountLink.url, stripeAccountId: account.id };
}
