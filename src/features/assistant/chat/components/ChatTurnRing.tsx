'use client';

import type { AssistantChatUsage } from '@/features/assistant/server/assistantUsageMonth';
import React, { useEffect, useId, useRef, useState } from 'react';

const SIZE = 18;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Compact monthly Ask-turn meter next to the send button. */
export function ChatTurnRing({ usage }: { usage: AssistantChatUsage }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const ratio =
    usage.limit <= 0 ? 0 : Math.min(1, Math.max(0, usage.used / usage.limit));
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const nearLimit = usage.remaining > 0 && usage.remaining <= 5;
  const empty = usage.remaining === 0;
  const label = `${usage.used} of ${usage.limit} questions this month`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        className="inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(current => !current)}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-white/15"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={
              empty
                ? 'text-[#E57373]'
                : nearLimit
                  ? 'text-[#E8B86D]'
                  : 'text-white/70'
            }
          />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          role="status"
          className="absolute right-0 bottom-[calc(100%+8px)] z-20 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#1C1C1C] px-2.5 py-1.5 text-[12px] leading-4 text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
          <span className="font-semibold text-white tabular-nums">
            {usage.used} of {usage.limit}
          </span>
          {' '}
          questions this month
        </div>
      ) : null}
    </div>
  );
}
