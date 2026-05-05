/**
 * Customer-safe message for Stripe Checkout session creation on a connected account.
 * Callers must `console.error` the raw `error` first — this string is never suitable
 * for diagnosing key/account mismatches; use logs and the Stripe Dashboard instead.
 */
export function userFacingStripeConnectCheckoutError(error: unknown): string {
  void error;
  return 'Could not start checkout.';
}
