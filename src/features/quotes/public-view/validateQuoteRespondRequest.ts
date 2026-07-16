/**
 * Pure validation for POST /api/quotes/respond (before DB).
 */

import { toTimeWithSeconds } from '@/features/quotes/shared/validateQuotePayloadFields';
import {
  formatQuoteAddressDisplayLine,
  validateStructuredQuoteRespondAddress,
  type QuoteRespondStructuredAddress,
} from './quoteRespondAddress';

export type QuoteRespondDecision = 'approve' | 'decline';

export type QuoteRespondSchedule = {
  scheduledDate: string;
  /** Stored as `HH:mm:ss`. */
  scheduledStartTimeForDb: string;
};

export type ValidatedQuoteRespondRequest =
  | {
      token: string;
      decision: 'approve';
      address: QuoteRespondStructuredAddress;
      /** Single-line summary (legacy `service_address` column + emails). */
      displayLine: string;
      /** Present when the customer picks a slot (quote had no schedule). */
      schedule: QuoteRespondSchedule | null;
    }
  | { token: string; decision: 'decline' };

export type ValidateQuoteRespondResult =
  | { ok: true; data: ValidatedQuoteRespondRequest }
  | { ok: false; error: string; status: number };

export type { QuoteRespondStructuredAddress };

function isDecision(v: unknown): v is QuoteRespondDecision {
  return v === 'approve' || v === 'decline';
}

function parseOptionalSchedule(
  raw: unknown
):
  | { ok: true; schedule: QuoteRespondSchedule | null }
  | { ok: false; error: string } {
  if (raw == null) {
    return { ok: true, schedule: null };
  }
  if (typeof raw !== 'object') {
    return { ok: false, error: 'Invalid schedule' };
  }
  const body = raw as {
    scheduledDate?: string;
    scheduledStartTime?: string;
  };
  const dateRaw = body.scheduledDate?.trim() ?? '';
  const timeRaw = body.scheduledStartTime?.trim() ?? '';
  if (!dateRaw && !timeRaw) {
    return { ok: true, schedule: null };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    return { ok: false, error: 'Scheduled date must be YYYY-MM-DD' };
  }
  if (!/^\d{2}:\d{2}$/.test(timeRaw)) {
    return { ok: false, error: 'Scheduled start time must be HH:mm' };
  }
  return {
    ok: true,
    schedule: {
      scheduledDate: dateRaw,
      scheduledStartTimeForDb: toTimeWithSeconds(timeRaw),
    },
  };
}

export function validateQuoteRespondRequest(
  raw: unknown
): ValidateQuoteRespondResult {
  const body = raw as {
    token?: string;
    decision?: string;
    serviceAddress?: string;
    address?: unknown;
    schedule?: unknown;
  };

  const token = body.token?.trim();
  const decision = body.decision;
  const serviceAddress = body.serviceAddress?.trim();

  if (!token || !isDecision(decision)) {
    return { ok: false, error: 'Invalid request', status: 400 };
  }

  if (decision === 'approve') {
    const scheduleParsed = parseOptionalSchedule(body.schedule);
    if (!scheduleParsed.ok) {
      return { ok: false, error: scheduleParsed.error, status: 400 };
    }

    const structured = validateStructuredQuoteRespondAddress(body.address);
    if (structured.ok) {
      return {
        ok: true,
        data: {
          token,
          decision: 'approve',
          address: structured.address,
          displayLine: formatQuoteAddressDisplayLine(structured.address),
          schedule: scheduleParsed.schedule,
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
          schedule: scheduleParsed.schedule,
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
