import { MARKETING_UTM_STORAGE_KEY } from '../constants';
import type { MarketingUtmAttribution } from '../types';

const UTM_PARAM_KEYS = [
  ['utmSource', 'utm_source'],
  ['utmMedium', 'utm_medium'],
  ['utmCampaign', 'utm_campaign'],
  ['utmContent', 'utm_content'],
  ['utmTerm', 'utm_term'],
  ['fbclid', 'fbclid'],
  ['gclid', 'gclid'],
] as const;

function trimParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseMarketingUtmsFromSearchParams(
  searchParams: URLSearchParams,
  landingPath = '/'
): MarketingUtmAttribution {
  const attribution: MarketingUtmAttribution = { landingPath };

  for (const [field, param] of UTM_PARAM_KEYS) {
    const value = trimParam(searchParams.get(param));
    if (value) attribution[field] = value;
  }

  return attribution;
}

export function hasMarketingUtmData(
  attribution: MarketingUtmAttribution
): boolean {
  return UTM_PARAM_KEYS.some(([field]) => Boolean(attribution[field]));
}

function readStoredUtms(): MarketingUtmAttribution | null {
  if (typeof window === 'undefined') return null;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(MARKETING_UTM_STORAGE_KEY);
      if (!raw) continue;
      return JSON.parse(raw) as MarketingUtmAttribution;
    } catch {
      // ignore corrupt payload
    }
  }

  return null;
}

function writeStoredUtms(payload: MarketingUtmAttribution): void {
  if (typeof window === 'undefined') return;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.setItem(MARKETING_UTM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }
}

/** First-touch: only writes when nothing meaningful is stored yet. */
export function persistMarketingUtms(
  attribution: MarketingUtmAttribution
): void {
  if (typeof window === 'undefined') return;

  const existing = readStoredUtms();
  if (existing && (hasMarketingUtmData(existing) || existing.landingPath)) {
    return;
  }

  const payload: MarketingUtmAttribution = {
    ...attribution,
    capturedAt: attribution.capturedAt ?? new Date().toISOString(),
  };

  if (
    typeof document !== 'undefined' &&
    document.referrer &&
    !payload.referrer
  ) {
    payload.referrer = document.referrer;
  }

  writeStoredUtms(payload);
}

export function captureMarketingUtmsFromSearchParams(
  searchParams: URLSearchParams,
  landingPath: string
): void {
  const fromUrl = parseMarketingUtmsFromSearchParams(searchParams, landingPath);
  const hasUrlUtms = hasMarketingUtmData(fromUrl);

  if (hasUrlUtms) {
    persistMarketingUtms(fromUrl);
    return;
  }

  persistMarketingUtms({ landingPath });
}

export function getStoredMarketingUtms(): MarketingUtmAttribution | undefined {
  return readStoredUtms() ?? undefined;
}
