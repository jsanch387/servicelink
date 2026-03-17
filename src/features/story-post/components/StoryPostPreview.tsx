'use client';

import { LinkIcon } from '@heroicons/react/24/outline';
import { forwardRef } from 'react';

interface StoryPostPreviewProps {
  businessName: string;
  /** Optional; no longer displayed in the story. */
  logoUrl?: string;
  bookingUrl: string;
}

export const StoryPostPreview = forwardRef<
  HTMLDivElement,
  StoryPostPreviewProps
>(({ businessName, bookingUrl }, ref) => {
  const displayUrl = bookingUrl.replace(/^https?:\/\//, '');

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center justify-between overflow-hidden"
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#0a0a0a',
        backgroundImage: `
            radial-gradient(circle at 50% 15%, rgba(255,255,255,0.07) 0%, transparent 60%),
            linear-gradient(180deg, #111111 0%, #000000 100%)
          `,
        padding: '160px 64px 160px',
      }}
    >
      {/* Top content – headline only (no logo) */}
      <div className="flex flex-col items-center text-center w-full">
        <div className="space-y-10 px-16 max-w-3xl">
          <span className="inline-block px-10 py-5 bg-white/5 border border-white/10 rounded-full text-sm tracking-[0.35em] text-zinc-300 uppercase font-bold">
            Online Booking
          </span>

          <div className="space-y-6">
            <h1 className="text-[88px] font-black text-black tracking-tight leading-[1.02] px-8 py-5 bg-white rounded-2xl">
              Book Now
            </h1>
            <div className="h-px w-24 bg-zinc-500 mx-auto" />
            <p className="text-[88px] font-bold tracking-tight leading-[1.02]">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                {businessName}
              </span>
            </p>
          </div>
          <p className="text-zinc-300 text-[32px] font-semibold">
            Available now for appointments
          </p>
        </div>
      </div>

      {/* Bottom link + branding */}
      <div className="w-full space-y-16">
        <div className="flex flex-col items-center gap-14">
          <div className="h-px w-48 bg-zinc-800" />
          <div className="text-center">
            <p className="text-2xl text-zinc-200 uppercase tracking-[0.28em] font-bold mb-8">
              Link in bio
            </p>
            <div className="bg-white/5 border border-white/10 rounded-[2.6rem] px-20 py-12 flex items-center gap-9">
              <LinkIcon className="h-12 w-12 text-zinc-50" />
              <span className="text-[36px] font-semibold text-white">
                {displayUrl}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center opacity-60 pt-14">
          <div className="flex items-center gap-5">
            <span className="text-[20px] tracking-[0.65em] text-white uppercase">
              Powered by
            </span>
            <span className="text-[20px] tracking-[0.65em] text-white uppercase font-black">
              ServiceLink
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

StoryPostPreview.displayName = 'StoryPostPreview';
