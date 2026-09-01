/**
 * Validation for POST /api/public/quote-request (public, unauthenticated).
 */

import { quoteRequestServiceNameFromAsk } from './buildQuoteRequestNote';

export interface PublicQuoteRequestBodyInput {
  businessSlug?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  /** @deprecated Use `details`. Still accepted so older clients do not 400. */
  serviceRequested?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicle2Year?: string;
  vehicle2Make?: string;
  vehicle2Model?: string;
  timeline?: string;
  details?: string;
}

export interface ValidatedPublicQuoteRequestBody {
  businessSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhoneDigits: string;
  serviceName: string;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicle2Year: string | null;
  vehicle2Make: string | null;
  vehicle2Model: string | null;
  timeline: string | null;
  details: string;
}

export type ValidatePublicQuoteRequestResult =
  | { ok: true; data: ValidatedPublicQuoteRequestBody }
  | { ok: false; error: string; status: number };

const DETAILS_MAX_LEN = 700;
const TIMELINE_MAX_LEN = 80;

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}

function isValidVehicleYear(value: string): boolean {
  return /^(19|20)\d{2}$/.test(value.trim());
}

function parseOptionalVehicle(
  year: string,
  make: string,
  model: string,
  label: string
):
  | { ok: true; year: string | null; make: string | null; model: string | null }
  | { ok: false; error: string } {
  const vy = year.trim();
  const vmk = make.trim();
  const vmd = model.trim();
  const anyVehicle = vy.length > 0 || vmk.length > 0 || vmd.length > 0;

  if (!anyVehicle) {
    return { ok: true, year: null, make: null, model: null };
  }

  if (!isValidVehicleYear(vy)) {
    return { ok: false, error: `Enter a valid 4-digit ${label} year` };
  }
  if (!vmk) {
    return { ok: false, error: `${label} make is required` };
  }
  if (!vmd) {
    return { ok: false, error: `${label} model is required` };
  }

  return { ok: true, year: vy, make: vmk, model: vmd };
}

export function validatePublicQuoteRequestBody(
  raw: unknown
): ValidatePublicQuoteRequestResult {
  const body = raw as PublicQuoteRequestBodyInput;

  if (!body?.businessSlug?.trim()) {
    return {
      ok: false,
      error: 'Business slug is required',
      status: 400,
    };
  }

  if (!body.customerName?.trim()) {
    return { ok: false, error: 'Name is required', status: 400 };
  }

  if (!isValidEmail(body.customerEmail ?? '')) {
    return { ok: false, error: 'A valid email is required', status: 400 };
  }

  const phoneDigits = (body.customerPhone ?? '').replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return {
      ok: false,
      error: 'Phone must be 10 digits',
      status: 400,
    };
  }

  const details = (body.details ?? body.serviceRequested ?? '').trim();
  if (!details) {
    return {
      ok: false,
      error: 'Tell us what you need done',
      status: 400,
    };
  }
  if (details.length > DETAILS_MAX_LEN) {
    return {
      ok: false,
      error: `Details must be at most ${DETAILS_MAX_LEN} characters`,
      status: 400,
    };
  }

  const vehicle1 = parseOptionalVehicle(
    body.vehicleYear ?? '',
    body.vehicleMake ?? '',
    body.vehicleModel ?? '',
    'Vehicle'
  );
  if (!vehicle1.ok) {
    return { ok: false, error: vehicle1.error, status: 400 };
  }

  const vehicle2 = parseOptionalVehicle(
    body.vehicle2Year ?? '',
    body.vehicle2Make ?? '',
    body.vehicle2Model ?? '',
    'Second vehicle'
  );
  if (!vehicle2.ok) {
    return { ok: false, error: vehicle2.error, status: 400 };
  }

  const timeline: string | null = (body.timeline ?? '').trim() || null;
  if (timeline && timeline.length > TIMELINE_MAX_LEN) {
    return {
      ok: false,
      error: `Timeline must be at most ${TIMELINE_MAX_LEN} characters`,
      status: 400,
    };
  }

  return {
    ok: true,
    data: {
      businessSlug: body.businessSlug.trim(),
      customerName: body.customerName.trim(),
      customerEmail: body.customerEmail!.trim(),
      customerPhoneDigits: phoneDigits,
      serviceName: quoteRequestServiceNameFromAsk(details),
      vehicleYear: vehicle1.year,
      vehicleMake: vehicle1.make,
      vehicleModel: vehicle1.model,
      vehicle2Year: vehicle2.year,
      vehicle2Make: vehicle2.make,
      vehicle2Model: vehicle2.model,
      timeline,
      details,
    },
  };
}
