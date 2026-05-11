/**
 * Debug logging for onboarding + Stripe trial flows.
 *
 * - **Development:** logs when `NODE_ENV !== 'production'`.
 * - **Production / staging:** set `DEBUG_STRIPE_ONBOARDING=1` to enable.
 *
 * Avoid logging emails, payment method details, or full session objects.
 */

export function onboardingStripeDebug(
  scope: string,
  message: string,
  data?: Record<string, unknown>
): void {
  const enabled =
    process.env.DEBUG_STRIPE_ONBOARDING === '1' ||
    process.env.NODE_ENV !== 'production';
  if (!enabled) return;
  const tag = `[stripe:onboarding:${scope}]`;
  if (data && Object.keys(data).length > 0) {
    console.debug(tag, message, data);
  } else {
    console.debug(tag, message);
  }
}
