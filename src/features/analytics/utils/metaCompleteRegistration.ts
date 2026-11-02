import { completeRegistrationEventId, trackMetaPixelEvent } from './metaPixel';

function trackedKey(userId: string): string {
  return `sl_meta_complete_registration:${userId}`;
}

/** Fire CompleteRegistration once per new user, with eventID for CAPI dedupe. */
export function trackMetaCompleteRegistrationOnce(
  userId: string,
  eventId?: string
): void {
  if (typeof window === 'undefined') return;

  const id = userId.trim();
  if (!id) return;

  const key = trackedKey(id);
  try {
    if (localStorage.getItem(key) === '1') return;
  } catch {
    // ignore
  }

  trackMetaPixelEvent(
    'CompleteRegistration',
    { content_name: 'signup' },
    eventId?.trim() || completeRegistrationEventId(id)
  );

  try {
    localStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}
