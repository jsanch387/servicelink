declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SIGNUP_PENDING_KEY = 'sl_google_ads_signup_pending';
const SIGNUP_TRACKED_KEY = 'sl_google_ads_signup_tracked';

function signupConversionSendTo(): string | null {
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_SEND_TO?.trim();
  return sendTo || null;
}

function fireSignupEvents(): void {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'sign_up', { method: 'website' });

  const sendTo = signupConversionSendTo();
  if (sendTo) {
    window.gtag('event', 'conversion', { send_to: sendTo });
  }
}

/** Queue Google Ads signup before a client navigation (email signup → check-email). */
export function markGoogleAdsSignupPending(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SIGNUP_TRACKED_KEY) === '1') return;
  sessionStorage.setItem(SIGNUP_PENDING_KEY, '1');
}

/** Fire Google Ads signup once per browser (deduped). */
export function trackGoogleAdsSignupOnce(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SIGNUP_TRACKED_KEY) === '1') return;

  fireSignupEvents();

  localStorage.setItem(SIGNUP_TRACKED_KEY, '1');
  sessionStorage.removeItem(SIGNUP_PENDING_KEY);
}

/** Send a signup queued before redirect (check-email page). */
export function flushGoogleAdsSignupIfPending(): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(SIGNUP_PENDING_KEY) !== '1') return;
  trackGoogleAdsSignupOnce();
}
