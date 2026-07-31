import type { MarketingUtmAttribution } from '../types';
import { isAppShellPath } from './utmCapture';

/**
 * Stable channel labels written to signup_attribution.channel.
 * Prefer these when answering “where did signups come from?”
 */
export const SIGNUP_ATTRIBUTION_CHANNELS = [
  'meta_ads',
  'tiktok_bio',
  'instagram_bio',
  'social_bio',
  'social_dm',
  'paid_search',
  'organic_google',
  'organic_bing',
  'organic_search',
  'blog',
  'site',
  'workshop',
  'biz_profile',
  'social_referral',
  'email',
  'direct',
  'unknown',
] as const;

export type SignupAttributionChannel =
  (typeof SIGNUP_ATTRIBUTION_CHANNELS)[number];

function lower(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function referrerHost(referrer?: string | null): string | null {
  if (!referrer?.trim()) return null;
  try {
    if (referrer.startsWith('android-app://')) {
      return referrer.replace(/^android-app:\/\//, '').split('/')[0] ?? null;
    }
    return new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function pathOnly(path?: string | null): string {
  return path?.split('?')[0]?.split('#')[0] || '';
}

function isBlogPath(path?: string | null): boolean {
  const normalized = pathOnly(path);
  return normalized === '/resources' || normalized.startsWith('/resources/');
}

function isSiteMarketingPath(path?: string | null): boolean {
  const normalized = pathOnly(path);
  return (
    normalized === '/' ||
    normalized === '/pricing' ||
    normalized === '/features' ||
    normalized === '/find-detailers' ||
    normalized === '/contact' ||
    normalized === '/workshop' ||
    normalized.startsWith('/workshop/')
  );
}

/** Public business booking pages look like /{slug} (not app chrome). */
function isBizProfilePath(path?: string | null): boolean {
  const normalized = pathOnly(path);
  if (
    !normalized ||
    normalized === '/' ||
    isAppShellPath(normalized) ||
    isBlogPath(normalized) ||
    isSiteMarketingPath(normalized)
  ) {
    return false;
  }
  const parts = normalized.split('/').filter(Boolean);
  return parts.length === 1;
}

function isPaidMedium(medium: string): boolean {
  return (
    medium === 'paid' ||
    medium === 'cpc' ||
    medium === 'cpm' ||
    medium === 'ppc' ||
    medium === 'paidsocial' ||
    medium === 'paid_social'
  );
}

/**
 * Derive a single readable channel from UTMs + landing + referrer.
 * Tagged campaign links win; otherwise fall back to landing/referrer.
 */
export function deriveSignupAttributionChannel(
  attribution?: MarketingUtmAttribution | null
): SignupAttributionChannel {
  if (!attribution) return 'unknown';

  const source = lower(attribution.utmSource);
  const medium = lower(attribution.utmMedium);
  const campaign = lower(attribution.utmCampaign);
  const host = referrerHost(attribution.referrer);
  const landing = pathOnly(attribution.landingPath);

  // --- Explicit UTMs ---
  if (source === 'blog') return 'blog';
  if (source === 'site') return 'site';
  if (
    source === 'workshop' ||
    campaign === 'workshop' ||
    medium === 'workshop'
  ) {
    return 'workshop';
  }

  if (medium === 'dm') return 'social_dm';

  if (source === 'tiktok') {
    if (medium === 'bio' || campaign === 'bio' || medium === '') {
      return 'tiktok_bio';
    }
    return 'social_bio';
  }

  if (
    (source === 'instagram' || source === 'ig') &&
    (medium === 'bio' || campaign === 'bio')
  ) {
    return 'instagram_bio';
  }

  if (medium === 'bio' || campaign === 'bio') {
    if (source === 'instagram' || source === 'ig' || source === 'meta') {
      return 'instagram_bio';
    }
    return 'social_bio';
  }

  if (
    source === 'meta' ||
    source === 'facebook' ||
    source === 'fb' ||
    medium === 'ig' ||
    medium === 'fb' ||
    Boolean(attribution.fbclid)
  ) {
    return 'meta_ads';
  }

  if (
    Boolean(attribution.gclid) ||
    (source === 'google' && isPaidMedium(medium)) ||
    medium === 'cpc' ||
    medium === 'ppc'
  ) {
    return 'paid_search';
  }

  if (source === 'email' || medium === 'email') return 'email';

  // --- Landing path ---
  if (isBlogPath(landing)) return 'blog';
  if (
    landing === '/pricing' ||
    landing === '/features' ||
    landing === '/find-detailers'
  ) {
    return 'site';
  }
  if (isBizProfilePath(landing)) return 'biz_profile';
  if (landing.startsWith('/workshop')) return 'workshop';

  // --- Referrer ---
  if (
    host === 'google.com' ||
    host?.endsWith('.google.com') ||
    host?.includes('googlequicksearchbox')
  ) {
    return 'organic_google';
  }
  if (host === 'bing.com' || host?.endsWith('.bing.com')) {
    return 'organic_bing';
  }
  if (
    host === 'duckduckgo.com' ||
    host === 'yahoo.com' ||
    host === 'search.yahoo.com'
  ) {
    return 'organic_search';
  }
  if (
    host?.includes('instagram') ||
    host?.includes('facebook') ||
    host?.includes('fb.com') ||
    host?.includes('tiktok') ||
    host?.includes('t.co') ||
    host?.includes('twitter.com') ||
    host?.includes('x.com') ||
    host?.includes('linkedin') ||
    host?.includes('youtube')
  ) {
    return 'social_referral';
  }
  if (
    host?.includes('android.gm') ||
    host === 'mail.google.com' ||
    host?.includes('outlook')
  ) {
    return 'email';
  }

  if (landing === '/') {
    return host ? 'unknown' : 'direct';
  }

  if (source || medium || campaign || landing || attribution.referrer) {
    return 'unknown';
  }

  return 'direct';
}
