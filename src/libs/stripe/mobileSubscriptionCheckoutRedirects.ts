/**
 * Expo app deep links for Stripe Checkout (Pro trial / upgrade) and Customer Portal.
 * Not environment-specific — same scheme host for dev/staging/prod builds of the app.
 *
 * Connect Express onboarding still uses STRIPE_MOBILE_CONNECT_ONBOARDING_* env URLs
 * (https bridge) because Stripe Account Link rejects custom URL schemes.
 */

/** Stripe replaces `{CHECKOUT_SESSION_ID}` after checkout (required for confirm-onboarding-trial). */
export const MOBILE_ONBOARDING_CHECKOUT_SUCCESS_URL =
  'servicelinkmobile://onboarding/stripe?result=success&session_id={CHECKOUT_SESSION_ID}';

export const MOBILE_ONBOARDING_CHECKOUT_CANCEL_URL =
  'servicelinkmobile://onboarding/stripe?result=cancel';

export const MOBILE_UPGRADE_CHECKOUT_SUCCESS_URL =
  'servicelinkmobile://paywall/stripe?result=success';

export const MOBILE_UPGRADE_CHECKOUT_CANCEL_URL =
  'servicelinkmobile://paywall/stripe?result=cancel';

export const MOBILE_BILLING_PORTAL_RETURN_URL =
  'servicelinkmobile://settings/subscription';
