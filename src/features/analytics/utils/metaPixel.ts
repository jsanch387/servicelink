declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '1456318202654985';

export function completeRegistrationEventId(userId: string): string {
  return `sl_cr_${userId.trim()}`;
}

export function subscribeEventId(userId: string): string {
  return `sl_sub_${userId.trim()}`;
}

/** Browser pixel with eventID for CAPI dedupe. */
export function trackMetaPixelEvent(
  event: string,
  params: Record<string, unknown> | undefined,
  eventID: string
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', event, params ?? {}, { eventID });
}
