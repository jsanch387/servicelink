'use client';

import { useEffect, type DependencyList, type MutableRefObject } from 'react';

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  // iOS Safari sometimes leaves documentElement/body scroll out of sync with window.
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Resets window scroll when public multi-step flows change screens.
 * Without this, leftover scrollY under a sticky back header makes the next
 * step look “pushed down.”
 */
export function useScrollWindowToTopOnChange(
  deps: DependencyList,
  options?: {
    /** When true for one change (e.g. Stripe return), skip that scroll reset. */
    skipRef?: MutableRefObject<boolean>;
  }
): void {
  const skipRef = options?.skipRef;

  useEffect(() => {
    if (skipRef?.current) {
      skipRef.current = false;
      return;
    }

    scrollWindowToTop();
    // Second pass after paint — sticky headers / late layout on mobile.
    const frame = requestAnimationFrame(() => {
      scrollWindowToTop();
    });
    return () => cancelAnimationFrame(frame);
    // Caller owns the dependency list (step keys, etc.).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps passthrough
  }, deps);
}
