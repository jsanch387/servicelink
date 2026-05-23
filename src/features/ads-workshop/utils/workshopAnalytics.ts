'use client';

export const WORKSHOP_ANALYTICS_EVENTS = {
  EMAIL_SUBMIT: 'workshop_email_submit',
  VIDEO_VIEW: 'workshop_video_view',
  SIGNUP_CLICK: 'workshop_signup_click',
  SIGNUP_COMPLETE: 'workshop_signup_complete',
} as const;

export type WorkshopAnalyticsEvent =
  (typeof WORKSHOP_ANALYTICS_EVENTS)[keyof typeof WORKSHOP_ANALYTICS_EVENTS];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type WorkshopAnalyticsProperties = Record<
  string,
  string | number | boolean | null
>;

/** Meta Pixel custom events (no Vercel Pro required). Supabase holds first-party funnel data. */
export function trackWorkshopEvent(
  event: WorkshopAnalyticsEvent,
  properties?: WorkshopAnalyticsProperties
): void {
  if (typeof window === 'undefined') return;

  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', event, properties ?? {});
  }
}
