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

/** Paths that are product/auth chrome — not acquisition landings. */
const APP_SHELL_EXACT_PATHS = new Set([
  '/login',
  '/signup',
  '/business/create',
  '/business/dashboard',
]);

const APP_SHELL_PREFIXES = [
  '/dashboard',
  '/auth',
  '/api',
  '/business/',
] as const;

function trimParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizePath(path: string): string {
  const bare = path.split('?')[0]?.split('#')[0] || '/';
  if (bare.length > 1 && bare.endsWith('/')) return bare.slice(0, -1);
  return bare || '/';
}

/**
 * Login, signup, OAuth/email-confirm, and dashboard routes should not be stored
 * as the marketing "landing" for signup attribution.
 */
export function isAppShellPath(path: string): boolean {
  const normalized = normalizePath(path);
  if (APP_SHELL_EXACT_PATHS.has(normalized)) return true;
  return APP_SHELL_PREFIXES.some(
    prefix =>
      normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix)
  );
}

/**
 * Referrers from email confirm / OAuth / same-site navigation are not where
 * the user discovered us.
 */
export function isNonAcquisitionReferrer(referrer: string): boolean {
  const trimmed = referrer.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith('android-app://')) {
    return /google|gm\b/i.test(trimmed);
  }

  try {
    const host = new URL(trimmed).hostname.replace(/^www\./, '').toLowerCase();
    if (
      host === 'accounts.google.com' ||
      host === 'appleid.apple.com' ||
      host === 'login.microsoftonline.com'
    ) {
      return true;
    }
    if (
      host === 'myservicelink.app' ||
      host.endsWith('.myservicelink.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
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

function hasMeaningfulLanding(attribution: MarketingUtmAttribution): boolean {
  return Boolean(
    attribution.landingPath && !isAppShellPath(attribution.landingPath)
  );
}

function hasAcquisitionReferrer(attribution: MarketingUtmAttribution): boolean {
  return Boolean(
    attribution.referrer && !isNonAcquisitionReferrer(attribution.referrer)
  );
}

/** True when stored touch is auth-only / empty and should not block better data. */
export function isWeakMarketingAttribution(
  attribution: MarketingUtmAttribution | null | undefined
): boolean {
  if (!attribution) return true;
  if (hasMarketingUtmData(attribution)) return false;
  if (hasMeaningfulLanding(attribution)) return false;
  // Referrer-only (e.g. google → /login) is provisional — allow marketing upgrade.
  return true;
}

function normalizeStoredAttribution(
  attribution: MarketingUtmAttribution
): MarketingUtmAttribution | null {
  const next: MarketingUtmAttribution = { ...attribution };

  if (
    next.landingPath &&
    isAppShellPath(next.landingPath) &&
    !hasMarketingUtmData(next)
  ) {
    delete next.landingPath;
  }

  if (next.referrer && isNonAcquisitionReferrer(next.referrer)) {
    delete next.referrer;
  }

  const hasSignal =
    hasMarketingUtmData(next) ||
    Boolean(next.landingPath) ||
    hasAcquisitionReferrer(next);

  return hasSignal ? next : null;
}

function readStoredUtms(): MarketingUtmAttribution | null {
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

function preferAcquisitionReferrer(
  preferred?: string,
  fallback?: string
): string | undefined {
  if (preferred && !isNonAcquisitionReferrer(preferred)) return preferred;
  if (fallback && !isNonAcquisitionReferrer(fallback)) return fallback;
  return undefined;
}

/** Prefer a real marketing path; fall back to tagged auth path if that is all we have. */
function resolveLandingPath(
  existingPath?: string,
  incomingPath?: string
): string | undefined {
  if (existingPath && !isAppShellPath(existingPath)) return existingPath;
  if (incomingPath && !isAppShellPath(incomingPath)) return incomingPath;
  // Tagged /signup or /login with UTMs is still useful when no prior marketing page.
  return incomingPath ?? existingPath;
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

  const existing = readStoredUtms();
  const existingHasUtms = Boolean(existing && hasMarketingUtmData(existing));
  const incomingHasUtms = hasMarketingUtmData(incoming);

  // Hard first-touch: real campaign data already stored.
  if (existingHasUtms) return;

  if (incomingHasUtms) {
    writeStoredUtms({
      ...incoming,
      landingPath: resolveLandingPath(
        existing?.landingPath,
        incoming.landingPath
      ),
      referrer: preferAcquisitionReferrer(
        existing?.referrer,
        incoming.referrer
      ),
      capturedAt: existing?.capturedAt ?? incoming.capturedAt,
    });
    return;
  }

  const incomingMarketingLanding = hasMeaningfulLanding(incoming);
  const incomingUsefulReferrer = hasAcquisitionReferrer(incoming);

  // Bare /login, /signup, /dashboard, /auth/* with no acquisition signal — ignore.
  if (!incomingMarketingLanding && !incomingUsefulReferrer) {
    return;
  }

  // Auth page + organic referrer only: keep referrer, do not pretend auth was the landing.
  if (!incomingMarketingLanding && incomingUsefulReferrer) {
    if (!existing) {
      writeStoredUtms({
        referrer: incoming.referrer,
        capturedAt: incoming.capturedAt,
      });
      return;
    }
    if (isWeakMarketingAttribution(existing) && !existing.referrer) {
      writeStoredUtms({
        ...existing,
        referrer: incoming.referrer,
        capturedAt: existing.capturedAt ?? incoming.capturedAt,
      });
    }
    return;
  }

  // Marketing page without UTMs (blog, homepage, pricing, biz profile, …).
  if (!existing || isWeakMarketingAttribution(existing)) {
    writeStoredUtms({
      landingPath: incoming.landingPath,
      referrer: preferAcquisitionReferrer(
        existing?.referrer,
        incoming.referrer
      ),
      capturedAt: existing?.capturedAt ?? incoming.capturedAt,
    });
  }
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
