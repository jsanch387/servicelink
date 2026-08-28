const SUBSCRIBE_TRACKED_KEY = 'sl_meta_subscribe_tracked';

/** Fire Meta Subscribe once per browser after Pro checkout succeeds. */
export function trackMetaSubscribeOnce(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SUBSCRIBE_TRACKED_KEY) === '1') return;

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Subscribe');
  }

  localStorage.setItem(SUBSCRIBE_TRACKED_KEY, '1');
}
