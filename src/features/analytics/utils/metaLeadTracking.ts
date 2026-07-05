declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const LEAD_PENDING_KEY = 'sl_meta_lead_pending';
const LEAD_TRACKED_KEY = 'sl_meta_lead_tracked';

/** Queue Lead before a client navigation (email signup → check-email). */
export function markMetaLeadPending(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(LEAD_TRACKED_KEY) === '1') return;
  sessionStorage.setItem(LEAD_PENDING_KEY, '1');
}

/** Fire Meta Lead once per browser (deduped). */
export function trackMetaLeadOnce(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(LEAD_TRACKED_KEY) === '1') return;

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead');
  }

  localStorage.setItem(LEAD_TRACKED_KEY, '1');
  sessionStorage.removeItem(LEAD_PENDING_KEY);
}

/** Send a Lead queued before redirect (check-email page). */
export function flushMetaLeadIfPending(): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(LEAD_PENDING_KEY) !== '1') return;
  trackMetaLeadOnce();
}
