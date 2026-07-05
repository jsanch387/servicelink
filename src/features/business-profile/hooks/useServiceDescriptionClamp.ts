'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** True when an element's content overflows vertically (e.g. under line-clamp). */
export function isParagraphContentClamped(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight + 1;
}

/**
 * Detects whether a line-clamped paragraph actually overflows.
 * Only measures while collapsed so expanded layout does not clear the flag.
 */
export function useServiceDescriptionClamp(
  description: string,
  isExpanded: boolean
) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncatable, setIsTruncatable] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || isExpanded) return;
    setIsTruncatable(isParagraphContentClamped(el));
  }, [isExpanded]);

  useLayoutEffect(() => {
    measure();
  }, [measure, description]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || isExpanded) return;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, isExpanded]);

  return { ref, isTruncatable };
}
