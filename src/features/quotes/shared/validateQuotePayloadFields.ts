/**
 * Shared quote field validation (customer, service, price, schedule).
 * Used by POST /api/quotes/send and PATCH /api/quotes/[id].
 *
 * Service address is not collected on send/patch — the customer provides it when
 * they accept the quote (`POST /api/quotes/respond`).
 */

export interface QuotePayloadInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  serviceName?: string;
  priceCents?: number;
  durationMinutes?: number;
  note?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
}

export interface ValidatedQuotePayloadFields {
  customerName: string;
  customerEmail: string;
  customerPhoneDigits: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  note: string | null;
  scheduledDate: string;
  /** Stored as `HH:mm:ss` when input was `HH:mm`. */
  scheduledStartTimeForDb: string;
}

export type ValidateQuotePayloadResult =
  | { ok: true; data: ValidatedQuotePayloadFields }
  | { ok: false; error: string; status: number };

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}

export function toTimeWithSeconds(hhmm: string): string {
  const trimmed = hhmm.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return `${trimmed}:00`;
}

export function normalizeOptionalPhoneDigits(
  value: string | undefined
): string | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

export function validateQuotePayloadFields(
  raw: unknown
): ValidateQuotePayloadResult {
  const body = raw as QuotePayloadInput;

  if (!body?.customerName?.trim()) {
    return {
      ok: false,
      error: 'Customer name is required',
      status: 400,
    };
  }
  if (!isValidEmail(body.customerEmail ?? '')) {
    return {
      ok: false,
      error: 'A valid customer email is required',
      status: 400,
    };
  }

  const customerPhoneDigits = normalizeOptionalPhoneDigits(body.customerPhone);
  if (body.customerPhone?.trim() && !customerPhoneDigits) {
    return {
      ok: false,
      error: 'Phone must be 10 digits or omitted',
      status: 400,
    };
  }

  if (!body.serviceName?.trim()) {
    return {
      ok: false,
      error: 'Service name is required',
      status: 400,
    };
  }
  if (!Number.isInteger(body.priceCents) || (body.priceCents as number) < 0) {
    return { ok: false, error: 'Price is invalid', status: 400 };
  }
  if (
    !Number.isInteger(body.durationMinutes) ||
    (body.durationMinutes as number) <= 0
  ) {
    return { ok: false, error: 'Duration is invalid', status: 400 };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate ?? '')) {
    return {
      ok: false,
      error: 'Scheduled date must be YYYY-MM-DD',
      status: 400,
    };
  }
  if (!/^\d{2}:\d{2}$/.test(body.scheduledStartTime ?? '')) {
    return {
      ok: false,
      error: 'Scheduled start time must be HH:mm',
      status: 400,
    };
  }

  return {
    ok: true,
    data: {
      customerName: body.customerName.trim(),
      customerEmail: body.customerEmail!.trim(),
      customerPhoneDigits,
      vehicleYear: body.vehicleYear?.trim() || null,
      vehicleMake: body.vehicleMake?.trim() || null,
      vehicleModel: body.vehicleModel?.trim() || null,
      serviceName: body.serviceName.trim(),
      priceCents: body.priceCents as number,
      durationMinutes: body.durationMinutes as number,
      note: body.note?.trim() || null,
      scheduledDate: body.scheduledDate!,
      scheduledStartTimeForDb: toTimeWithSeconds(body.scheduledStartTime!),
    },
  };
}
