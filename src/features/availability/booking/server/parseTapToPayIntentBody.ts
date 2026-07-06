/**
 * Parse Tap to Pay intent request body (sessionFees only).
 */

import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';
import { parseSessionFeesInput } from './parseSessionFeesInput';

export interface TapToPayIntentRequestBody {
  sessionFees: JobCompletedSessionFeeInput[];
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

  return { ok: true, body: { sessionFees } };
}
