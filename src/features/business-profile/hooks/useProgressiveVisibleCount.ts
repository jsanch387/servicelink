'use client';

import { useEffect, useRef, useState } from 'react';
import {
  GALLERY_INITIAL_VISIBLE,
  GALLERY_VISIBLE_BATCH,
} from '../utils/workPhotoSrc';

export function useProgressiveVisibleCount(total: number): {
  visibleCount: number;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
} {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(GALLERY_INITIAL_VISIBLE, total)
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(GALLERY_INITIAL_VISIBLE, total));
  }, [total]);

  useEffect(() => {
    if (visibleCount >= total) return;
    const node = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisibleCount(total);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(count =>
            Math.min(count + GALLERY_VISIBLE_BATCH, total)
          );
        }
      },
      { rootMargin: '320px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, total]);

  return { visibleCount, sentinelRef };
}
