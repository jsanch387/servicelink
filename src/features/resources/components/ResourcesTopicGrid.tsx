import {
  LinkIcon,
  PlayCircleIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

import {
  RESOURCES_TOPIC_TILES,
  RESOURCES_WORKSHOP_CARD,
} from '../data/resourcesSeoContent';

const TOPIC_ICONS = {
  social: VideoCameraIcon,
  'booking-link': LinkIcon,
} as const;

export function ResourcesTopicGrid() {
  return (
    <section
      className="mb-12 sm:mb-16"
      aria-labelledby="resources-topics-heading"
    >
      <h2
        id="resources-topics-heading"
        className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight"
      >
        What you will find here
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        {RESOURCES_TOPIC_TILES.map(topic => {
          const Icon = TOPIC_ICONS[topic.id];
          return (
            <div
              key={topic.id}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.04] blur-2xl transition-opacity group-hover:opacity-100 opacity-60"
                aria-hidden
              />
              <div className="relative flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">
                    {topic.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={RESOURCES_WORKSHOP_CARD.href}
        className="group block relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-6 sm:p-8 transition-all hover:border-white/35 hover:from-white/[0.1]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-lg shadow-white/10">
              <PlayCircleIcon className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="inline-block text-xs font-medium text-white/60 mb-2">
                Free masterclass
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {RESOURCES_WORKSHOP_CARD.title}
              </h3>
              <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
                {RESOURCES_WORKSHOP_CARD.description}
              </p>
            </div>
          </div>
          <span className="flex w-full sm:w-auto sm:shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-5 py-3 sm:py-2.5 text-sm font-semibold text-neutral-900 transition-transform group-hover:scale-[1.02]">
            Watch free workshop
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
