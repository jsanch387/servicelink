'use client';

import { GlassCard } from '@/components/shared';
import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { ADS_WORKSHOP_VIDEO } from '../constants';
import { getYoutubeEmbedSrc } from '../utils/getYoutubeEmbedSrc';

export function AdsWorkshopVideoPlayer() {
  const embedSrc = ADS_WORKSHOP_VIDEO.youtubeUrl
    ? getYoutubeEmbedSrc(ADS_WORKSHOP_VIDEO.youtubeUrl)
    : null;

  return (
    <article id="workshop-video" aria-label="Workshop video">
      <GlassCard padding="lg" rounded="rounded-2xl" className="w-full">
        <header className="mb-4 sm:mb-5 text-center sm:text-left">
          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase mb-2">
            {ADS_WORKSHOP_VIDEO.durationLabel} masterclass
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            {ADS_WORKSHOP_VIDEO.title}
          </h2>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            {ADS_WORKSHOP_VIDEO.description}
          </p>
        </header>

        {embedSrc ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <iframe
              src={embedSrc}
              title={ADS_WORKSHOP_VIDEO.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center px-4">
            <PlayCircleIcon
              className="h-12 w-12 text-gray-500"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-sm font-medium text-gray-400">
              Video link coming soon
            </p>
          </div>
        )}
      </GlassCard>
    </article>
  );
}
