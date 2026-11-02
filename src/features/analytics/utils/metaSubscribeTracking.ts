import { subscribeEventId, trackMetaPixelEvent } from './metaPixel';

const SUBSCRIBE_TRACKED_KEY = 'sl_meta_subscribe_tracked';

/** Fire Meta Subscribe once after Pro checkout succeeds (not CompleteRegistration). */
export function trackMetaSubscribeOnce(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SUBSCRIBE_TRACKED_KEY) === '1') return;

  const eventID = userId?.trim()
    ? subscribeEventId(userId.trim())
    : `sl_sub_${Date.now()}`;

  trackMetaPixelEvent('Subscribe', { content_name: 'pro' }, eventID);

  localStorage.setItem(SUBSCRIBE_TRACKED_KEY, '1');
}
