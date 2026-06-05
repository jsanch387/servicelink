import React from 'react';

/** Smoky neutral spotlight behind the hero mock. */
export function HeroVisualGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[36%] bottom-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-[44%] h-[min(60vw,580px)] w-[min(98vw,1020px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[72px] sm:blur-[100px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.17) 0%, rgba(185,185,185,0.085) 36%, rgba(120,120,120,0.04) 58%, transparent 78%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[48%] h-[min(40vw,380px)] w-[min(76vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[56px] sm:blur-[72px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(165,165,165,0.06) 48%, transparent 74%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[50%] h-[min(28vw,240px)] w-[min(52vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px] opacity-80 sm:opacity-100"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(140,140,140,0.04) 55%, transparent 80%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--dashboard-bg)]/70 to-transparent sm:hidden" />
    </div>
  );
}
