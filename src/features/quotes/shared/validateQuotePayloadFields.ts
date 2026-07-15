/**
 * Shared quote field validation (customer, service, price, schedule).
 * Used by POST /api/quotes/send and PATCH /api/quotes/[id].
 *
 * Service address is not collected on send/patch — the customer provides it when
 * they accept the quote (`POST /api/quotes/respond`).
 */

import {
  isUuid,
  normalizeQuoteAddonDetails,
  type QuoteAddonDetail,
} from './quoteServiceSnapshot';

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
  /** Catalog: `business_services.id` */
  serviceId?: string;
  /** Catalog: `service_price_options.id` */
  servicePriceOptionId?: string;
  /** Base catalog price before add-ons (cents). */
  servicePriceCents?: number;
  /** Selected add-ons snapshot. */
  addonDetails?: QuoteAddonDetail[];
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
  /** Null when the owner omits schedule — customer picks on accept. */
  scheduledDate: string | null;
  /** Stored as `HH:mm:ss` when input was `HH:mm`. Null with `scheduledDate`. */
  scheduledStartTimeForDb: string | null;
  serviceId: string | null;
  servicePriceOptionId: string | null;
  servicePriceCents: number | null;
  addonDetails: QuoteAddonDetail[] | null;
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
  const scheduleDateRaw = body.scheduledDate?.trim() ?? '';
  const scheduleTimeRaw = body.scheduledStartTime?.trim() ?? '';
  const hasScheduleDate = scheduleDateRaw.length > 0;
  const hasScheduleTime = scheduleTimeRaw.length > 0;

  if (hasScheduleDate !== hasScheduleTime) {
    return {
      ok: false,
      error: 'Provide both scheduled date and start time, or omit both',
      status: 400,
    };
  }

  let scheduledDate: string | null = null;
  let scheduledStartTimeForDb: string | null = null;

  if (hasScheduleDate && hasScheduleTime) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDateRaw)) {
      return {
        ok: false,
        error: 'Scheduled date must be YYYY-MM-DD',
        status: 400,
      };
    }
    if (!/^\d{2}:\d{2}$/.test(scheduleTimeRaw)) {
      return {
        ok: false,
        error: 'Scheduled start time must be HH:mm',
        status: 400,
      };
    }
    scheduledDate = scheduleDateRaw;
    scheduledStartTimeForDb = toTimeWithSeconds(scheduleTimeRaw);
  }

  const serviceIdRaw = body.serviceId?.trim() ?? '';
  const serviceId = serviceIdRaw
    ? isUuid(serviceIdRaw)
      ? serviceIdRaw
      : null
    : null;
  if (serviceIdRaw && !serviceId) {
    return { ok: false, error: 'serviceId is invalid', status: 400 };
  }

  const optionIdRaw = body.servicePriceOptionId?.trim() ?? '';
  const servicePriceOptionId = optionIdRaw
    ? isUuid(optionIdRaw)
      ? optionIdRaw
      : null
    : null;
  if (optionIdRaw && !servicePriceOptionId) {
    return {
      ok: false,
      error: 'servicePriceOptionId is invalid',
      status: 400,
    };
  }

  let servicePriceCents: number | null = null;
  if (body.servicePriceCents != null) {
    if (
      !Number.isInteger(body.servicePriceCents) ||
      body.servicePriceCents < 0
    ) {
      return { ok: false, error: 'servicePriceCents is invalid', status: 400 };
    }
    servicePriceCents = body.servicePriceCents;
  }

  let addonDetails: QuoteAddonDetail[] | null = null;
  if (body.addonDetails != null) {
    if (!Array.isArray(body.addonDetails)) {
      return { ok: false, error: 'addonDetails must be an array', status: 400 };
    }
    addonDetails = normalizeQuoteAddonDetails(body.addonDetails);
    if (body.addonDetails.length > 0 && !addonDetails) {
      return { ok: false, error: 'addonDetails is invalid', status: 400 };
    }
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
      scheduledDate,
      scheduledStartTimeForDb,
      serviceId,
      servicePriceOptionId,
      servicePriceCents,
      addonDetails,
    },
  };
}
