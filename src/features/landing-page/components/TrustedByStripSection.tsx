'use client';

import React from 'react';

const TRUSTED_BUSINESSES = [
  {
    name: 'Elite Auto Detailing Co.',
    location: 'Austin, TX',
  },
  {
    name: 'Prime Shine Mobile Detail',
    location: 'Tampa, FL',
  },
  {
    name: 'Diamond Finish Detailing',
    location: 'Phoenix, AZ',
  },
  {
    name: 'City Glow Auto Spa',
    location: 'Charlotte, NC',
  },
  {
    name: 'Precision Wash & Detail',
    location: 'San Diego, CA',
  },
  {
    name: 'Revive Mobile Detail',
    location: 'Nashville, TN',
  },
] as const;

export const TrustedByStripSection: React.FC = () => {
  const items = [...TRUSTED_BUSINESSES, ...TRUSTED_BUSINESSES];

  return (
    <section
      className="relative py-7 sm:py-8 border-t border-b border-white/[0.08] overflow-hidden"
      aria-label="Trusted by"
    >
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02]"
        aria-hidden
      />

      <div className="mb-3 px-4 sm:px-6">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-500 text-center">
          Used by 100+ businesses
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[var(--dashboard-bg)] via-[var(--dashboard-bg)]/75 to-transparent z-[1]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[var(--dashboard-bg)] via-[var(--dashboard-bg)]/75 to-transparent z-[1]" />
        <div
          className="pointer-events-none absolute inset-0 z-[1] animate-strip-sheen"
          style={{
            background:
              'linear-gradient(110deg, transparent 0%, transparent 42%, rgba(255,255,255,0.08) 50%, transparent 58%, transparent 100%)',
          }}
          aria-hidden
        />

        <div className="flex w-max gap-3 px-3 sm:px-4 animate-marquee-premium hover:[animation-play-state:paused]">
          {items.map((business, idx) => (
            <div
              key={`${business.name}-${idx}`}
              className="inline-flex min-w-[220px] items-center rounded-none border border-white/12 bg-white/[0.04] px-3.5 py-3 text-xs text-gray-100 whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[12px] font-semibold tracking-[0.01em] text-gray-100">
                  {business.name}
                </span>
                <span className="truncate text-[11px] text-gray-400">
                  {business.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
