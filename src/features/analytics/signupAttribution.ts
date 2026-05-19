/**
 * First-touch signup attribution (UTM + referrer).
 * Stored on `profiles.signup_attribution` / `signup_channel` after signup.
 */

export const SIGNUP_ATTRIBUTION_STORAGE_KEY = 'sl_signup_attribution';
export const SIGNUP_ATTRIBUTION_COOKIE = 'sl_signup_attribution';
const ATTRIBUTION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export interface SignupAttributionPayload {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
  captured_at: string;
}

export function captureSignupAttributionFromLocation(
  search: string,
  pathname: string,
  documentReferrer: string
): SignupAttributionPayload | null {
  const params = new URLSearchParams(search);
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].some(
    key => params.get(key)?.trim()
  );
  const ref = documentReferrer?.trim() || null;
  const landing = pathname?.trim() || '/';

  if (!hasUtm && !ref && landing === '/') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      referrer: null,
      landing_path: landing,
      captured_at: new Date().toISOString(),
    };
  }

  return {
    utm_source: params.get('utm_source')?.trim() || null,
    utm_medium: params.get('utm_medium')?.trim() || null,
    utm_campaign: params.get('utm_campaign')?.trim() || null,
    utm_content: params.get('utm_content')?.trim() || null,
    utm_term: params.get('utm_term')?.trim() || null,
    referrer: ref,
    landing_path: landing,
    captured_at: new Date().toISOString(),
  };
}

/** Human-readable channel for admin breakdowns. */
export function deriveSignupChannel(
  attribution: Pick<
    SignupAttributionPayload,
    'utm_source' | 'utm_medium' | 'utm_campaign' | 'referrer'
  >
): string {
  const source = (attribution.utm_source ?? '').toLowerCase();
  const medium = (attribution.utm_medium ?? '').toLowerCase();
  const campaign = (attribution.utm_campaign ?? '').toLowerCase();
  const referrer = (attribution.referrer ?? '').toLowerCase();

  const isMeta =
    source.includes('facebook') ||
    source === 'fb' ||
    source.includes('meta') ||
    campaign.includes('facebook') ||
    referrer.includes('facebook.com') ||
    referrer.includes('fb.com') ||
    referrer.includes('fb.me');

  if (isMeta) {
    if (
      source.includes('instagram') ||
      source === 'ig' ||
      referrer.includes('instagram.com')
    ) {
      return 'Instagram';
    }
    return 'Facebook / Meta';
  }

  if (
    source.includes('tiktok') ||
    source === 'tt' ||
    referrer.includes('tiktok.com')
  ) {
    return 'TikTok';
  }

  if (source.includes('google') || referrer.includes('google.')) {
    if (
      medium.includes('cpc') ||
      medium.includes('ppc') ||
      medium === 'paid' ||
      medium.includes('paid')
    ) {
      return 'Google Ads';
    }
    return 'Google';
  }

  if (source.includes('youtube') || referrer.includes('youtube.com')) {
    return 'YouTube';
  }

  if (source.includes('linkedin') || referrer.includes('linkedin.com')) {
    return 'LinkedIn';
  }

  if (medium === 'email' || source === 'email' || source.includes('newsletter')) {
    return 'Email';
  }

  if (source) {
    return source.charAt(0).toUpperCase() + source.slice(1);
  }

  if (referrer) {
    try {
      const host = new URL(
        referrer.startsWith('http') ? referrer : `https://${referrer}`
      ).hostname.replace(/^www\./, '');
      return host || 'Referral';
    } catch {
      return 'Referral';
    }
  }

  return 'Direct / Unknown';
}

export function readStoredSignupAttribution(): SignupAttributionPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem(SIGNUP_ATTRIBUTION_STORAGE_KEY) ??
      readAttributionCookie();
    if (!raw) return null;
    return JSON.parse(raw) as SignupAttributionPayload;
  } catch {
    return null;
  }
}

function readAttributionCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SIGNUP_ATTRIBUTION_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(SIGNUP_ATTRIBUTION_COOKIE.length + 1));
}

export function storeSignupAttribution(payload: SignupAttributionPayload): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(payload);
  try {
    window.localStorage.setItem(SIGNUP_ATTRIBUTION_STORAGE_KEY, json);
  } catch {
    /* ignore quota */
  }
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${SIGNUP_ATTRIBUTION_COOKIE}=${encodeURIComponent(json)}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/** First-touch only — does not overwrite an existing capture. */
export function ensureSignupAttributionCaptured(): void {
  if (typeof window === 'undefined') return;
  if (readStoredSignupAttribution()) return;

  const payload = captureSignupAttributionFromLocation(
    window.location.search,
    window.location.pathname,
    document.referrer ?? ''
  );
  if (payload) storeSignupAttribution(payload);
}

/** Parse first-touch cookie set before OAuth redirect (server-safe). */
export function parseSignupAttributionCookie(
  cookieHeader: string | null
): SignupAttributionPayload | null {
  if (!cookieHeader?.trim()) return null;
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SIGNUP_ATTRIBUTION_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(
      match.slice(SIGNUP_ATTRIBUTION_COOKIE.length + 1)
    );
    const parsed = JSON.parse(raw) as SignupAttributionPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function persistSignupAttributionToProfile(): Promise<void> {
  const payload = readStoredSignupAttribution();
  if (!payload) return;

  try {
    const res = await fetch('/api/profile/signup-attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean };
      if (json.success) {
        window.localStorage.removeItem(SIGNUP_ATTRIBUTION_STORAGE_KEY);
      }
    }
  } catch {
    /* retry on next dashboard visit */
  }
}
