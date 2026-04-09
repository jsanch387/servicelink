/**
 * Pure validation for POST /api/quotes/respond (before DB).
 */

export type QuoteRespondDecision = 'approve' | 'decline';

export type ValidatedQuoteRespondRequest =
  | { token: string; decision: 'approve'; serviceAddress: string }
  | { token: string; decision: 'decline'; serviceAddress?: string };

export type ValidateQuoteRespondResult =
  | { ok: true; data: ValidatedQuoteRespondRequest }
  | { ok: false; error: string; status: number };

function isDecision(v: unknown): v is QuoteRespondDecision {
  return v === 'approve' || v === 'decline';
}

export function validateQuoteRespondRequest(
  raw: unknown
): ValidateQuoteRespondResult {
  const body = raw as {
    token?: string;
    decision?: string;
    serviceAddress?: string;
  };

  const token = body.token?.trim();
  const decision = body.decision;
  const serviceAddress = body.serviceAddress?.trim();

  if (!token || !isDecision(decision)) {
    return { ok: false, error: 'Invalid request', status: 400 };
  }

  if (
    decision === 'approve' &&
    (!serviceAddress || serviceAddress.length < 6)
  ) {
    return {
      ok: false,
      error: 'Service address is required to accept quote',
      status: 400,
    };
  }

  if (decision === 'approve') {
    return {
      ok: true,
      data: {
        token,
        decision: 'approve',
        serviceAddress: serviceAddress!,
      },
    };
  }

  return {
    ok: true,
    data: { token, decision: 'decline', serviceAddress },
  };
}
