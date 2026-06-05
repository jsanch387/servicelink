import React from 'react';

interface MarketingGalaxyBackgroundProps {
  /** Soft atmospheric accents on landing page. Hidden on mobile. */
  showStreaks?: boolean;
}

/**
 * Fixed smoky glows behind marketing and auth screens.
 */
export const MarketingGalaxyBackground: React.FC<
  MarketingGalaxyBackgroundProps
> = ({ showStreaks = true }) => (
  <div
    className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    aria-hidden
  >
    <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-[var(--dashboard-bg)] via-[var(--dashboard-bg)]/35 to-transparent" />

    <div
      className="absolute -top-[24%] -right-[8%] h-[66vmax] w-[66vmax] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(190,190,190,0.04) 40%, transparent 72%)',
      }}
    />
    <div
      className="absolute -bottom-[30%] -left-[16%] h-[60vmax] w-[60vmax] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(255,255,255,0.065) 0%, rgba(150,150,150,0.035) 45%, transparent 74%)',
      }}
    />

    <div
      className="absolute top-[30%] left-1/2 h-[44vmax] w-[82vmax] -translate-x-1/2 rounded-full blur-[100px]"
      style={{
        background:
          'radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, rgba(175,175,175,0.05) 42%, transparent 70%)',
      }}
    />

    {showStreaks ? (
      <div className="hidden sm:block">
        <div
          className="absolute top-[6%] -left-[12%] h-[38vmax] w-[72vmax] origin-top-left rotate-[28deg] blur-3xl opacity-70 animate-marketing-streak-pulse"
          style={{
            animationDelay: '0s',
            background:
              'linear-gradient(118deg, rgba(255,255,255,0.16) 0%, rgba(210,210,210,0.09) 28%, transparent 68%)',
          }}
        />
        <div
          className="absolute top-[54%] -right-[10%] h-[30vmax] w-[58vmax] -rotate-[14deg] blur-3xl opacity-60 animate-marketing-streak-pulse"
          style={{
            animationDelay: '3s',
            background:
              'linear-gradient(250deg, transparent 0%, rgba(255,255,255,0.13) 38%, rgba(185,185,185,0.07) 58%, transparent 88%)',
          }}
        />
      </div>
    ) : null}
  </div>
);
