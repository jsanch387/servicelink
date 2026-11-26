import Image from 'next/image';
import React from 'react';
import { SAMPLE_SHOP } from './sampleShop';

type BrowserDeviceFrameProps = {
  children?: React.ReactNode;
  screenshotSrc?: string | null;
  screenshotAlt?: string;
  url?: string;
  className?: string;
};

/** macOS-style browser chrome for desktop product mocks. */
export function BrowserDeviceFrame({
  children,
  screenshotSrc,
  screenshotAlt = '',
  url = SAMPLE_SHOP.url,
  className = '',
}: BrowserDeviceFrameProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-transform duration-500 motion-safe:hover:-translate-y-1 ${className}`.trim()}
      aria-hidden={!screenshotSrc}
    >
      <div className="mb-2 flex items-center gap-3 px-1.5 pt-0.5" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/14" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </span>
        <span className="flex h-7 min-w-0 flex-1 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-[11px] text-zinc-500">
          <span className="truncate">{url}</span>
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-[#0F0F0F]">
        {screenshotSrc ? (
          <div className="relative aspect-[16/10]">
            <Image
              src={screenshotSrc}
              alt={screenshotAlt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
