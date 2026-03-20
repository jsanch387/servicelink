'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const SIGNUP_PIXEL_FLAG_KEY = 'sl_meta_complete_registration_pending';

/**
 * Fires Meta CompleteRegistration once after a successful signup redirect.
 */
export const MetaCompleteRegistrationTracker = () => {
  useEffect(() => {
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const shouldTrackFromOAuth = params?.get('sl_signup') === '1';
    const shouldTrack =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(SIGNUP_PIXEL_FLAG_KEY) === '1';

    if (!shouldTrack && !shouldTrackFromOAuth) return;
    if (typeof window.fbq !== 'function') return;

    window.fbq('track', 'CompleteRegistration');
    window.sessionStorage.removeItem(SIGNUP_PIXEL_FLAG_KEY);

    if (shouldTrackFromOAuth && params) {
      params.delete('sl_signup');
      const newQuery = params.toString();
      const nextUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, []);

  return null;
};

