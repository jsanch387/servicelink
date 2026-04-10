/**
 * Validation for POST /api/public/quote-request (public, unauthenticated).
 */

export interface PublicQuoteRequestBodyInput {
  businessSlug?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceRequested?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
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

  if (!body.serviceRequested?.trim()) {
    return { ok: false, error: 'Service is required', status: 400 };
  }

  const details = (body.details ?? '').trim();
  if (!details) {
    return {
      ok: false,
      error: 'Project details are required',
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

  const vy = (body.vehicleYear ?? '').trim();
  const vmk = (body.vehicleMake ?? '').trim();
  const vmd = (body.vehicleModel ?? '').trim();
  const anyVehicle = vy.length > 0 || vmk.length > 0 || vmd.length > 0;

  if (anyVehicle) {
    if (!isValidVehicleYear(vy)) {
      return {
        ok: false,
        error: 'Enter a valid 4-digit vehicle year',
        status: 400,
      };
    }
    if (!vmk) {
      return { ok: false, error: 'Vehicle make is required', status: 400 };
    }
    if (!vmd) {
      return { ok: false, error: 'Vehicle model is required', status: 400 };
    }
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
      serviceName: body.serviceRequested.trim(),
      vehicleYear: anyVehicle ? vy : null,
      vehicleMake: anyVehicle ? vmk : null,
      vehicleModel: anyVehicle ? vmd : null,
      timeline,
      details,
    },
  };
}
