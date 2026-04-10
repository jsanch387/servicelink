/**
 * Pure validation for POST /api/quotes/respond (before DB).
 */

import {
  formatQuoteAddressDisplayLine,
  validateStructuredQuoteRespondAddress,
  type QuoteRespondStructuredAddress,
} from './quoteRespondAddress';

export type QuoteRespondDecision = 'approve' | 'decline';

export type ValidatedQuoteRespondRequest =
  | {
      token: string;
      decision: 'approve';
      address: QuoteRespondStructuredAddress;
      /** Single-line summary (legacy `service_address` column + emails). */
      displayLine: string;
    }
  | { token: string; decision: 'decline' };

export type ValidateQuoteRespondResult =
  | { ok: true; data: ValidatedQuoteRespondRequest }
  | { ok: false; error: string; status: number };

export type { QuoteRespondStructuredAddress };

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
    address?: unknown;
  };

  const token = body.token?.trim();
  const decision = body.decision;
  const serviceAddress = body.serviceAddress?.trim();

  if (!token || !isDecision(decision)) {
    return { ok: false, error: 'Invalid request', status: 400 };
  }

  if (decision === 'approve') {
    const structured = validateStructuredQuoteRespondAddress(body.address);
    if (structured.ok) {
      return {
        ok: true,
        data: {
          token,
          decision: 'approve',
          address: structured.address,
          displayLine: formatQuoteAddressDisplayLine(structured.address),
        },
      };
    }

    if (serviceAddress && serviceAddress.length >= 6) {
      const address: QuoteRespondStructuredAddress = {
        street: serviceAddress,
        unit: null,
        city: '',
        state: '',
        zip: '',
      };
      return {
        ok: true,
        data: {
          token,
          decision: 'approve',
          address,
          displayLine: serviceAddress,
        },
      };
    }

    return {
      ok: false,
      error:
        'A complete service address is required to accept this quote (street, city, state, ZIP) or a legacy full address line',
      status: 400,
    };
  }

  return {
    ok: true,
    data: { token, decision: 'decline' },
  };
}
