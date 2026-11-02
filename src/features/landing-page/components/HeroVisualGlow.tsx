import React from 'react';

/** Smoky neutral spotlight behind the hero mock. */
export function HeroVisualGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[36%] bottom-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-[44%] h-[min(56vw,520px)] w-[min(92vw,920px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] sm:blur-[110px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, rgba(185,185,185,0.055) 38%, rgba(120,120,120,0.025) 60%, transparent 78%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[48%] h-[min(36vw,340px)] w-[min(70vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[64px] sm:blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(165,165,165,0.04) 48%, transparent 74%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--dashboard-bg)]/70 to-transparent sm:hidden" />
    </div>
  );
}
