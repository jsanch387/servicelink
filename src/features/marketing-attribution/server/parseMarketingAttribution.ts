import type { MarketingUtmAttribution } from '../types';

const MAX_LEN = 512;

function sanitizeOptional(value: unknown, maxLen = 255): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed || undefined;
}

export function parseMarketingAttributionFromBody(
  body: Record<string, unknown>
): MarketingUtmAttribution {
  return {
    utmSource: sanitizeOptional(body.utmSource),
    utmMedium: sanitizeOptional(body.utmMedium),
    utmCampaign: sanitizeOptional(body.utmCampaign),
    utmContent: sanitizeOptional(body.utmContent),
    utmTerm: sanitizeOptional(body.utmTerm),
    fbclid: sanitizeOptional(body.fbclid, MAX_LEN),
    gclid: sanitizeOptional(body.gclid, MAX_LEN),
    landingPath: sanitizeOptional(body.landingPath),
    referrer: sanitizeOptional(body.referrer, MAX_LEN),
  };
}

export function toSignupAttributionRow(
  attribution?: MarketingUtmAttribution
): Record<string, string | null> {
  if (!attribution) {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      fbclid: null,
      gclid: null,
      landing_path: null,
      referrer: null,
    };
  }

  return {
    utm_source: attribution.utmSource ?? null,
    utm_medium: attribution.utmMedium ?? null,
    utm_campaign: attribution.utmCampaign ?? null,
    utm_content: attribution.utmContent ?? null,
    utm_term: attribution.utmTerm ?? null,
    fbclid: attribution.fbclid ?? null,
    gclid: attribution.gclid ?? null,
    landing_path: attribution.landingPath ?? null,
    referrer: attribution.referrer ?? null,
  };
}
