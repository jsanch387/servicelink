'use client';

import { useLayoutEffect } from 'react';

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  // iOS Safari sometimes leaves documentElement/body scroll out of sync with window.
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function setScrollBehavior(value: string) {
  document.documentElement.style.scrollBehavior = value;
  document.body.style.scrollBehavior = value;
}

/**
 * Pins a public landing page to the top on first open.
 * Browser scroll restoration and overflow-anchor (images / sale banner)
 * otherwise leave the booking-link profile slightly scrolled down.
 */
export function useResetWindowScrollOnMount(): void {
  useLayoutEffect(() => {
    if (window.location.hash) {
      return;
    }

    const historyApi = window.history;
    const previousRestoration = historyApi.scrollRestoration;
    const previousHtmlBehavior = document.documentElement.style.scrollBehavior;
    const previousBodyBehavior = document.body.style.scrollBehavior;

    try {
      historyApi.scrollRestoration = 'manual';
    } catch {
      // Some browsers expose scrollRestoration as read-only.
    }

    // CSS `body { scroll-behavior: smooth }` can override JS `behavior: 'auto'`.
    setScrollBehavior('auto');
    scrollWindowToTop();

    const frame = window.requestAnimationFrame(scrollWindowToTop);
    // Sale banner / decoded images can still shift layout after first paint.
    const timeout = window.setTimeout(scrollWindowToTop, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      document.documentElement.style.scrollBehavior = previousHtmlBehavior;
      document.body.style.scrollBehavior = previousBodyBehavior;
      try {
        historyApi.scrollRestoration = previousRestoration;
      } catch {
        // ignore
      }
    };
  }, []);
}
