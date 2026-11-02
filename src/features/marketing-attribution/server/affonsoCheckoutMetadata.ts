import type { NextRequest } from 'next/server';

export const AFFONSO_REFERRAL_COOKIE = 'affonso_referral';

const AFFONSO_REFERRAL_MAX_LEN = 128;

export function normalizeAffonsoReferral(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, AFFONSO_REFERRAL_MAX_LEN);
}

export function affonsoReferralFromRequest(request: NextRequest): string {
  return normalizeAffonsoReferral(
    request.cookies.get(AFFONSO_REFERRAL_COOKIE)?.value
  );
}

/** Cookie first (official path), then a client-sent `window.affonso_referral` fallback. */
export function resolveAffonsoReferral(
  request: NextRequest,
  bodyReferral?: unknown
): string {
  return (
    affonsoReferralFromRequest(request) ||
    normalizeAffonsoReferral(bodyReferral)
  );
}

/** Merge Affonso referral onto Stripe Checkout metadata (key always present). */
export function withAffonsoCheckoutMetadata(
  metadata: Record<string, string>,
  referral: string
): Record<string, string> {
  return {
    ...metadata,
    affonso_referral: normalizeAffonsoReferral(referral),
  };
}
