import { createTapToPayConnectionToken } from '@/features/availability/booking/server/createTapToPayConnectionToken';
import { ensureTerminalLocation } from '@/features/payments/server/ensureTerminalLocation';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type IssueTapToPayConnectionTokenResult =
  | {
      ok: true;
      secret: string;
      stripeAccountId: string;
      terminalLocationId: string;
    }
  | { ok: false; httpStatus: number; error: string };

/**
 * Ensures Terminal location + creates a connection token on the connected account.
 * Shared by booking-scoped and merchant warm-up routes.
 */
export async function issueTapToPayConnectionToken(opts: {
  supabase: SupabaseClient<Database>;
  businessId: string;
  stripeAccountId: string;
  logContext?: string;
}): Promise<IssueTapToPayConnectionTokenResult> {
  const logContext = opts.logContext?.trim() || 'tap-to-pay';

  const terminalResult = await ensureTerminalLocation({
    supabase: opts.supabase,
    businessId: opts.businessId,
  });
  if (!terminalResult.ok) {
    return {
      ok: false,
      httpStatus: terminalResult.httpStatus,
      error: terminalResult.error,
    };
  }

  if (terminalResult.stripeAccountId !== opts.stripeAccountId) {
    console.error(`[${logContext}] stripe account mismatch`, {
      businessId: opts.businessId,
      requestedAccountId: opts.stripeAccountId,
      terminalAccountId: terminalResult.stripeAccountId,
    });
    return {
      ok: false,
      httpStatus: 500,
      error: "Couldn't connect to payments. Try again or mark as paid.",
    };
  }

  const tokenResult = await createTapToPayConnectionToken({
    stripeAccountId: opts.stripeAccountId,
    terminalLocationId: terminalResult.terminalLocationId,
  });
  if (!tokenResult.ok) {
    return {
      ok: false,
      httpStatus: 500,
      error: tokenResult.error,
    };
  }

  return {
    ok: true,
    secret: tokenResult.secret,
    stripeAccountId: opts.stripeAccountId,
    terminalLocationId: terminalResult.terminalLocationId,
  };
}
