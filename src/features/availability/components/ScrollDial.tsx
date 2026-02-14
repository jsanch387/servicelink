'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PADDING_Y = ITEM_HEIGHT * 2;

interface ScrollDialProps {
  options: { value: string; label: string }[];
  value: string;
  // eslint-disable-next-line no-unused-vars -- callback type; param name required by TS
  onChange: (value: string) => void;
  /** When false, do not sync scroll from value (avoids fighting user scroll when draft updates) */
  syncFromValue?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const ScrollDial: React.FC<ScrollDialProps> = ({
  options,
  value,
  onChange,
  syncFromValue = true,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isSyncingFromPropRef = useRef(false);

  const selectedIndex = options.findIndex(o => o.value === value);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const scrollToIndex = useCallback((index: number, instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const targetScroll =
      PADDING_Y + index * ITEM_HEIGHT - CONTAINER_HEIGHT / 2 + ITEM_HEIGHT / 2;
    el.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: instant ? 'auto' : 'smooth',
    });
  }, []);

  // Sync scroll position when value (from parent) changes (e.g. open picker). Skip when syncFromValue is false to avoid fighting user scroll.
  useEffect(() => {
    if (syncFromValue === false || !scrollRef.current || options.length === 0)
      return;
    isSyncingFromPropRef.current = true;
    const el = scrollRef.current;
    const targetScroll =
      PADDING_Y +
      safeIndex * ITEM_HEIGHT -
      CONTAINER_HEIGHT / 2 +
      ITEM_HEIGHT / 2;
    el.scrollTop = Math.max(0, targetScroll);
    const t = setTimeout(() => {
      isSyncingFromPropRef.current = false;
    }, 150);
    return () => clearTimeout(t);
  }, [safeIndex, options.length, syncFromValue]);

  const handleScroll = useCallback(() => {
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    setIsScrolling(true);
    scrollEndTimeoutRef.current = setTimeout(() => {
      scrollEndTimeoutRef.current = null;
      setIsScrolling(false);
      if (isSyncingFromPropRef.current) return;
      const el = scrollRef.current;
      if (!el || options.length === 0) return;
      // Viewport center in content coords; item i center is at (i + 0.5) * ITEM_HEIGHT from list start
      const center = el.scrollTop + CONTAINER_HEIGHT / 2 - PADDING_Y;
      let index = Math.round(center / ITEM_HEIGHT - 0.5);
      index = Math.max(0, Math.min(index, options.length - 1));
      const newValue = options[index].value;
      if (newValue !== value) {
        onChange(newValue);
      }
      scrollToIndex(index, true);
    }, 120);
  }, [onChange, options, value, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current)
        clearTimeout(scrollEndTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: CONTAINER_HEIGHT }}
      aria-label={ariaLabel}
    >
      <div
        className="absolute left-0 right-0 pointer-events-none border-y border-white/10 bg-white/5 rounded-lg"
        style={{
          top: CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2,
          height: ITEM_HEIGHT,
        }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: PADDING_Y,
          paddingBottom: PADDING_Y,
        }}
      >
        {options.map(opt => (
          <div
            key={opt.value}
            className="flex items-center justify-center text-lg font-medium transition-colors"
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
            }}
          >
            <span
              className={
                value === opt.value && !isScrolling
                  ? 'text-white font-semibold'
                  : 'text-gray-500'
              }
            >
              {opt.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
