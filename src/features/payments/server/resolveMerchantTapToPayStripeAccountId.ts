/**
 * When mobile sends stripeAccountId on merchant warm-up, it must match the business Connect account.
 */
export function resolveMerchantTapToPayStripeAccountId(opts: {
  merchantStripeAccountId: string;
  requestedStripeAccountId?: string | null;
}):
  | { ok: true; stripeAccountId: string }
  | { ok: false; httpStatus: 403; error: string } {
  const merchantStripeAccountId = opts.merchantStripeAccountId.trim();
  if (!merchantStripeAccountId) {
    return {
      ok: false,
      httpStatus: 403,
      error: 'Not authorized for this Stripe account.',
    };
  }

  const requested = opts.requestedStripeAccountId?.trim();
  if (requested && requested !== merchantStripeAccountId) {
    return {
      ok: false,
      httpStatus: 403,
      error: 'Not authorized for this Stripe account.',
    };
  }

  return { ok: true, stripeAccountId: merchantStripeAccountId };
}
