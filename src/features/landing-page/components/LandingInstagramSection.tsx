import {
  instagramReelEmbedUrl,
  instagramReelShortcode,
  instagramReelUrl,
} from '@/constants/marketingSocial';
import { InstagramIcon } from '@/icons';
import React from 'react';
import {
  LANDING_INSTAGRAM_HANDLE,
  LANDING_INSTAGRAM_PROFILE_URL,
  LANDING_INSTAGRAM_REELS,
} from '../data/landingInstagram';

const profileLinkClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]';

const watchLinkClass =
  'flex cursor-pointer items-center justify-center gap-1.5 border-t border-white/10 px-3 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white';

function InstagramReelEmbed({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative aspect-[9/16] overflow-hidden bg-black">
      <iframe
        src={src}
        title={title}
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-[36%] scale-[1.82] border-0 bg-black"
        allow="encrypted-media; fullscreen; picture-in-picture; clipboard-write"
        loading="lazy"
      />
    </div>
  );
}

export function LandingInstagramSection() {
  const reels = LANDING_INSTAGRAM_REELS.map(instagramReelShortcode)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section
      className="px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="social-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <h2
            id="social-heading"
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            See it on social.
          </h2>
          <p className="mt-2 text-lg text-zinc-400">
            Real shops. Real bookings.
          </p>
          <a
            href={LANDING_INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${profileLinkClass} mt-5`}
          >
            <InstagramIcon className="h-4 w-4" />@{LANDING_INSTAGRAM_HANDLE}
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {reels.map(code => (
            <div
              key={code}
              className="overflow-hidden rounded-[22px] border border-white/10 bg-black"
            >
              <InstagramReelEmbed
                src={instagramReelEmbedUrl(code)}
                title="ServiceLink Instagram reel"
              />
              <a
                href={instagramReelUrl(code)}
                target="_blank"
                rel="noopener noreferrer"
                className={watchLinkClass}
              >
                Watch on Instagram
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
