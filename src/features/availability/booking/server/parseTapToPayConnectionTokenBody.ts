/**
 * Optional body for POST …/tap-to-pay/connection-token.
 * Mobile sends stripeAccountId from the intent response so the server can
 * validate Connect account alignment before creating the Terminal token.
 */

export interface TapToPayConnectionTokenRequestBody {
  stripeAccountId?: string;
}

export type ParseTapToPayConnectionTokenBodyResult =
  | { ok: true; body: TapToPayConnectionTokenRequestBody }
  | { ok: false; error: string };

export function parseTapToPayConnectionTokenBody(
  raw: unknown
): ParseTapToPayConnectionTokenBodyResult {
  if (raw === undefined || raw === null) {
    return { ok: true, body: {} };
  }
  if (typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const stripeAccountIdRaw = (raw as { stripeAccountId?: unknown })
    .stripeAccountId;
  if (stripeAccountIdRaw === undefined) {
    return { ok: true, body: {} };
  }
  if (typeof stripeAccountIdRaw !== 'string' || !stripeAccountIdRaw.trim()) {
    return { ok: false, error: 'stripeAccountId must be a non-empty string.' };
  }

  return {
    ok: true,
    body: { stripeAccountId: stripeAccountIdRaw.trim() },
  };
}

/**
 * When mobile sends stripeAccountId, it must match the booking's Connect account.
 */
export function resolveTapToPayStripeAccountId(opts: {
  bookingStripeAccountId: string;
  requestedStripeAccountId?: string | null;
}): { ok: true; stripeAccountId: string } | { ok: false; error: string } {
  const bookingStripeAccountId = opts.bookingStripeAccountId.trim();
  if (!bookingStripeAccountId) {
    return { ok: false, error: 'Stripe account is not configured.' };
  }

  const requested = opts.requestedStripeAccountId?.trim();
  if (requested && requested !== bookingStripeAccountId) {
    return {
      ok: false,
      error: 'Stripe account does not match this business.',
    };
  }

  return { ok: true, stripeAccountId: bookingStripeAccountId };
}
