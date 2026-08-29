import { StarIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { LANDING_STATS } from '../data/landingStats';

function StatCell({
  stat,
  index,
}: {
  stat: (typeof LANDING_STATS)[number];
  index: number;
}) {
  const isStar = 'icon' in stat && stat.icon === 'star';

  return (
    <div
      className={`px-4 py-5 text-center sm:px-5 ${
        index % 2 === 1 ? 'border-l border-white/[0.08]' : ''
      } ${index >= 2 ? 'border-t border-white/[0.08] sm:border-t-0' : ''} sm:border-l sm:border-white/[0.08] sm:first:border-l-0`}
    >
      <p
        className="inline-flex items-center justify-center gap-1 text-xl font-semibold tracking-tight text-white sm:text-2xl"
        aria-label={isStar ? '5 star ratings' : undefined}
      >
        {stat.value}
        {isStar ? (
          <StarIcon
            className="h-5 w-5 text-amber-400 sm:h-6 sm:w-6"
            aria-hidden
          />
        ) : null}
      </p>
      <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{stat.label}</p>
    </div>
  );
}

export function LandingStatsBar() {
  return (
    <section
      className="bg-[#141414] px-4 py-8 sm:px-6 sm:py-10"
      aria-labelledby="landing-stats-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p
          id="landing-stats-heading"
          className="text-base font-medium text-zinc-200 sm:text-lg"
        >
          Trusted by detailers across the country.
        </p>
        <div
          className="mt-2.5 flex items-center justify-center gap-0.5"
          aria-hidden
        >
          {Array.from({ length: 5 }, (_, index) => (
            <StarIcon key={index} className="h-3.5 w-3.5 text-amber-400" />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {LANDING_STATS.map((stat, index) => (
            <StatCell key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
