import React from 'react';

interface MarketingGalaxyBackgroundProps {
  /** Diagonal light streaks (landing page). Auth screens typically omit these. */
  showStreaks?: boolean;
}

/**
 * Fixed galaxy glows (+ optional light streaks) behind marketing and auth screens.
 */
export const MarketingGalaxyBackground: React.FC<
  MarketingGalaxyBackgroundProps
> = ({ showStreaks = true }) => (
  <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
    <div
      className="absolute -top-[20%] -right-[10%] h-[70vmax] w-[70vmax] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(200,220,255,0.03) 40%, transparent 70%)',
      }}
    />
    <div
      className="absolute -bottom-[30%] -left-[15%] h-[60vmax] w-[60vmax] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(220,200,255,0.025) 50%, transparent 70%)',
      }}
    />
    <div
      className="absolute top-1/2 left-1/2 h-[80vmin] w-[100vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background:
          'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 60%)',
      }}
    />
    {showStreaks ? (
      <>
        <div
          className="absolute top-[15%] -left-[10%] h-[2px] w-[120%] rotate-[-25deg] blur-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, transparent 25%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0.12) 55%, transparent 75%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-[52%] right-[-20%] h-[2px] w-[80%] rotate-[-20deg] blur-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          }}
        />
      </>
    ) : null}
  </div>
);
