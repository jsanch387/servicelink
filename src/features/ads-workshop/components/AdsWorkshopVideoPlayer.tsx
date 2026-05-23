'use client';

import { GlassCard } from '@/components/shared';
import { ADS_WORKSHOP_VIDEO, WORKSHOP_YOUTUBE_EMBED_SRC } from '../constants';

export type AdsWorkshopVideoPlayerProps = {
  /** Hides title block — use when the watch page carries context below the player. */
  compact?: boolean;
};

export function AdsWorkshopVideoPlayer({
  compact = false,
}: AdsWorkshopVideoPlayerProps) {
  return (
    <article id="workshop-video" aria-label="Workshop video">
      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        className="w-full p-3 sm:p-5"
      >
        {!compact ? (
          <header className="mb-3 sm:mb-4 text-center">
            <p className="text-sm text-white/70 mb-1.5">
              {ADS_WORKSHOP_VIDEO.durationLabel} · On-demand masterclass
            </p>
            <h2 className="text-lg sm:text-xl font-semibold text-white text-balance">
              {ADS_WORKSHOP_VIDEO.title}
            </h2>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed text-pretty">
              {ADS_WORKSHOP_VIDEO.description}
            </p>
          </header>
        ) : (
          <p className="mb-2 text-center text-sm text-white/70">
            {ADS_WORKSHOP_VIDEO.durationLabel} masterclass
          </p>
        )}

        <div className="aspect-video w-full overflow-hidden rounded-lg sm:rounded-xl border border-white/10 bg-black/40 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
          <iframe
            src={WORKSHOP_YOUTUBE_EMBED_SRC}
            title={ADS_WORKSHOP_VIDEO.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </GlassCard>
    </article>
  );
}
