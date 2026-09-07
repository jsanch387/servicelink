import { MARKETING_UTM_STORAGE_KEY } from '../constants';
import type { MarketingUtmAttribution } from '../types';
import {
  readMarketingAttributionCookie,
  writeMarketingAttributionCookie,
} from './attributionCookie';
import {
  UTM_PARAM_KEYS,
  hasMarketingUtmData,
  isNonAcquisitionReferrer,
  normalizeStoredAttribution,
  resolveFirstTouchAttribution,
} from './firstTouchAttribution';

export {
  hasMarketingUtmData,
  isAppShellPath,
  isNonAcquisitionReferrer,
  isWeakMarketingAttribution,
} from './firstTouchAttribution';

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

function readFromWebStorage(): MarketingUtmAttribution | null {
  if (typeof window === 'undefined') return null;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(MARKETING_UTM_STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as MarketingUtmAttribution;
      const normalized = normalizeStoredAttribution(parsed);
      if (normalized) return normalized;
    } catch {
      // ignore corrupt payload
    }
  }

  return null;
}

function readStoredUtms(): MarketingUtmAttribution | null {
  return readFromWebStorage() ?? readMarketingAttributionCookie();
}

function writeStoredUtms(payload: MarketingUtmAttribution): void {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(payload);

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.setItem(MARKETING_UTM_STORAGE_KEY, serialized);
    } catch {
      // ignore quota / private mode
    }
  }

  writeMarketingAttributionCookie(payload);
}

function attachDocumentReferrer(
  attribution: MarketingUtmAttribution
): MarketingUtmAttribution {
  if (attribution.referrer || typeof document === 'undefined') {
    return attribution;
  }

  const referrer = document.referrer?.trim();
  if (!referrer || isNonAcquisitionReferrer(referrer)) {
    return attribution;
  }

  return { ...attribution, referrer };
}

/**
 * First-touch attribution with upgrades:
 * - Campaign params (UTMs / click ids) win once and never get overwritten.
 * - Auth/dashboard/email-confirm paths do not lock first-touch.
 * - A later marketing landing can replace a weak auth-only touch.
 */
export function persistMarketingUtms(
  attribution: MarketingUtmAttribution
): void {
  if (typeof window === 'undefined') return;

  const incoming = attachDocumentReferrer({
    ...attribution,
    capturedAt: attribution.capturedAt ?? new Date().toISOString(),
  });

  const next = resolveFirstTouchAttribution(readStoredUtms(), incoming);
  if (next) writeStoredUtms(next);
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
  const stored = readStoredUtms();
  if (!stored) return undefined;

  // Hydrate web storage from cookie after OAuth / magic-link return.
  if (!readFromWebStorage()) {
    writeStoredUtms(stored);
  }

  return stored;
}
