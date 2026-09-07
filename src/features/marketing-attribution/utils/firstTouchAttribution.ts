import type { MarketingUtmAttribution } from '../types';

export const UTM_PARAM_KEYS = [
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

export function normalizeStoredAttribution(
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
 * First-touch merge. Returns the payload to store, or null when nothing
 * should be written (including when a strong first-touch already exists).
 *
 * - Campaign params (UTMs / click ids) win once and never get overwritten.
 * - Auth/dashboard/email-confirm paths do not lock first-touch.
 * - A later marketing landing can replace a weak auth-only touch.
 * - A later bare `/` visit does not replace a Meta click.
 */
export function resolveFirstTouchAttribution(
  existing: MarketingUtmAttribution | null,
  incoming: MarketingUtmAttribution
): MarketingUtmAttribution | null {
  const incomingHasUtms = hasMarketingUtmData(incoming);
  const existingHasUtms = Boolean(existing && hasMarketingUtmData(existing));

  if (existingHasUtms) return null;

  if (incomingHasUtms) {
    return {
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
    };
  }

  const incomingMarketingLanding = hasMeaningfulLanding(incoming);
  const incomingUsefulReferrer = hasAcquisitionReferrer(incoming);

  if (!incomingMarketingLanding && !incomingUsefulReferrer) {
    return null;
  }

  if (!incomingMarketingLanding && incomingUsefulReferrer) {
    if (!existing) {
      return {
        referrer: incoming.referrer,
        capturedAt: incoming.capturedAt,
      };
    }
    if (isWeakMarketingAttribution(existing) && !existing.referrer) {
      return {
        ...existing,
        referrer: incoming.referrer,
        capturedAt: existing.capturedAt ?? incoming.capturedAt,
      };
    }
    return null;
  }

  if (!existing || isWeakMarketingAttribution(existing)) {
    return {
      landingPath: incoming.landingPath,
      referrer: preferAcquisitionReferrer(
        existing?.referrer,
        incoming.referrer
      ),
      capturedAt: existing?.capturedAt ?? incoming.capturedAt,
    };
  }

  return null;
}
