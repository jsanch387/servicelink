/**
 * Parse Tap to Pay intent request body (sessionFees only).
 */

import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import { parseSessionFeesInput } from './parseSessionFeesInput';
import { parseTipCents } from './parseTipCents';

export interface TapToPayIntentRequestBody {
  sessionFees: JobCompletedSessionFeeInput[];
  /** Customer tip added on top of the job balance. 0 means no tip. */
  tipCents: number;
}

export type ParseTapToPayIntentBodyResult =
  | { ok: true; body: TapToPayIntentRequestBody }
  | { ok: false; error: string };

export function parseTapToPayIntentBody(
  raw: unknown
): ParseTapToPayIntentBodyResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const sessionFees = parseSessionFeesInput(
    (raw as { sessionFees?: unknown }).sessionFees
  );
  if (sessionFees === null) {
    return {
      ok: false,
      error: 'sessionFees must be an array of { label, amountCents }.',
    };
  }

  const tip = parseTipCents((raw as { tipCents?: unknown }).tipCents);
  if (!tip.ok) {
    return { ok: false, error: tip.error };
  }

  return { ok: true, body: { sessionFees, tipCents: tip.tipCents } };
}
