'use client';

import { tiktokEmbedUrl, tiktokVideoUrl } from '@/constants/marketingSocial';
import { TikTokIcon } from '@/icons';
import React from 'react';
import {
  LANDING_TIKTOK_HANDLE,
  LANDING_TIKTOK_PROFILE_URL,
  LANDING_TIKTOK_VIDEO_IDS,
} from '../data/landingTikTok';

const PLACEHOLDER_SLOTS = 3;

export function LandingTikTokSection() {
  const videoIds = LANDING_TIKTOK_VIDEO_IDS.filter(Boolean);

  return (
    <section
      className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="tiktok-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <h2
            id="tiktok-heading"
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            See it on TikTok.
          </h2>
          <p className="mt-2 text-lg text-zinc-400">
            Real shops. Real bookings.
          </p>
          <a
            href={LANDING_TIKTOK_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
          >
            <TikTokIcon className="h-4 w-4" />@{LANDING_TIKTOK_HANDLE}
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {videoIds.length > 0
            ? videoIds.slice(0, 3).map(id => (
                <a
                  key={id}
                  href={tiktokVideoUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-black"
                  aria-label={`Watch ServiceLink on TikTok`}
                >
                  <iframe
                    src={tiktokEmbedUrl(id)}
                    title={`TikTok ${id}`}
                    className="aspect-[9/16] h-auto w-full border-0"
                    allow="encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </a>
              ))
            : Array.from({ length: PLACEHOLDER_SLOTS }, (_, index) => (
                <a
                  key={index}
                  href={LANDING_TIKTOK_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-[9/16] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] px-6 text-center transition-colors hover:border-white/25 hover:bg-white/[0.05]"
                >
                  <TikTokIcon className="h-8 w-8 text-zinc-400" />
                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    Watch on TikTok
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    @{LANDING_TIKTOK_HANDLE}
                  </p>
                </a>
              ))}
        </div>
      </div>
    </section>
  );
}
