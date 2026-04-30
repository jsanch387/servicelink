/**
 * Maps Stripe errors from `checkout.sessions.create(..., { stripeAccount })` to an API-safe message.
 * Connect failures often mean test/live key mismatch or a connected account from another platform.
 */

export function userFacingStripeConnectCheckoutError(error: unknown): string {
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return error.message;
  }

  const err = error as { code?: string; type?: string };
  if (
    err?.code === 'account_invalid' ||
    err?.type === 'StripePermissionError'
  ) {
    return (
      'Payments cannot start: this Stripe connected account does not match your platform API keys. ' +
      'Use test keys with test Express accounts (or live with live), and reconnect Stripe in Business settings if needed.'
    );
  }

  return 'Could not start checkout.';
}
