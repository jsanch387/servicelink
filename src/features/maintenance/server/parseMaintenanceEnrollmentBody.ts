import { serviceDurationHHmmToMinutes } from '@/features/availability/utils/timeOptions';

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export type ParsedMaintenanceEnrollmentBody = {
  customerId: string;
  serviceNameSnapshot: string;
  priceCents: number;
  durationMinutes: number;
  /** When true, anchorDate and anchorTime are set for DB insert. */
  hasAnchorDate: boolean;
  anchorDateTrimmed: string;
  anchorTimeTrimmed: string;
  /** Mobile-only: required when auth is Bearer. */
  businessId?: string;
  /** Mobile-only: optional slug consistency check. */
  businessSlug?: string;
};

type ParseResult =
  | { ok: true; data: ParsedMaintenanceEnrollmentBody }
  | { ok: false; error: string; status: number };

export function parseMaintenanceEnrollmentBody(json: unknown): ParseResult {
  if (!json || typeof json !== 'object') {
    return { ok: false, error: 'Invalid request body', status: 400 };
  }

  const body = json as Record<string, unknown>;

  const customerId =
    typeof body.customerId === 'string' ? body.customerId.trim() : '';
  if (!customerId) {
    return { ok: false, error: 'Customer is required', status: 400 };
  }

  const serviceNameSnapshot =
    (typeof body.serviceNameSnapshot === 'string'
      ? body.serviceNameSnapshot.trim()
      : '') || 'Maintenance';

  const priceCents =
    typeof body.priceCents === 'number'
      ? Math.max(0, Math.floor(body.priceCents))
      : NaN;
  const durationMinutes =
    typeof body.durationMinutes === 'number'
      ? Math.max(0, Math.floor(body.durationMinutes))
      : typeof body.durationHHmm === 'string'
        ? serviceDurationHHmmToMinutes(body.durationHHmm)
        : NaN;

  if (!Number.isFinite(priceCents)) {
    return { ok: false, error: 'Price is required', status: 400 };
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < 30) {
    return { ok: false, error: 'Visit duration is required', status: 400 };
  }

  const anchorDate = typeof body.anchorDate === 'string' ? body.anchorDate : '';
  const anchorTime = typeof body.anchorTime === 'string' ? body.anchorTime : '';
  const anchorDateTrimmed = anchorDate.trim();
  const anchorTimeTrimmed = anchorTime.trim().slice(0, 5);
  const hasAnchorDate = anchorDateTrimmed.length > 0;
  const hasAnchorTime = anchorTimeTrimmed.length > 0;

  if (hasAnchorDate !== hasAnchorTime) {
    return {
      ok: false,
      error: 'Set both a preferred date and time, or leave both blank.',
      status: 400,
    };
  }

  if (hasAnchorDate) {
    if (!isIsoDate(anchorDateTrimmed) || !isTimeHHmm(anchorTimeTrimmed)) {
      return {
        ok: false,
        error: 'Preferred date and time must be valid.',
        status: 400,
      };
    }
  }

  const businessId =
    typeof body.businessId === 'string' ? body.businessId.trim() : undefined;
  const businessSlug =
    typeof body.businessSlug === 'string'
      ? body.businessSlug.trim()
      : undefined;

  return {
    ok: true,
    data: {
      customerId,
      serviceNameSnapshot,
      priceCents,
      durationMinutes,
      hasAnchorDate,
      anchorDateTrimmed,
      anchorTimeTrimmed,
      ...(businessId ? { businessId } : {}),
      ...(businessSlug ? { businessSlug } : {}),
    },
  };
}
