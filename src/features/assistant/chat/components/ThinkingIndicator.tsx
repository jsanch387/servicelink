'use client';

import React from 'react';

/** Small pulsing dots + “Thinking…” while the model is working. */
export function ThinkingIndicator() {
  return (
    <span
      className="inline-flex items-center gap-2 text-[15px] leading-6 text-white/45"
      aria-live="polite"
    >
      <span className="assistant-thinking-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      Thinking…
    </span>
  );
}
