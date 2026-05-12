/**
 * Verbose debug logging for onboarding + Stripe trial flows.
 *
 * Off by default. Set **`DEBUG_STRIPE_ONBOARDING=1`** to log request/branch
 * details (user id suffixes, session ids, etc.).
 *
 * API routes use `console.info` / `console.warn` / `console.error` for normal
 * transactional success and failure lines.
 */

export function onboardingStripeDebug(
  scope: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (process.env.DEBUG_STRIPE_ONBOARDING !== '1') return;
  const tag = `[stripe:onboarding:${scope}]`;
  if (data && Object.keys(data).length > 0) {
    console.debug(tag, message, data);
  } else {
    console.debug(tag, message);
  }
}
